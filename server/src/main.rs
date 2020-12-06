use http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use std::env;
use tokio_compat_02::FutureExt;
use uuid::Uuid;
use warp::{Filter, Rejection};

mod api;
mod auth;

type DbConn = sqlx::Pool<sqlx::Postgres>;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&env::var("DATABASE_URL").unwrap())
        .compat()
        .await
        .unwrap();

    let auth_routes = auth::routes(pool.clone());
    let api_routes = api::routes(pool.clone());

    let routes = auth_routes
        .or(api_routes)
        .recover(|err: Rejection| async move {
            Ok::<_, Rejection>(match err.find() {
                Some(Errors::Unauthorized) => {
                    warp::reply::with_status("Unauthorized", StatusCode::UNAUTHORIZED)
                }
                Some(Errors::UserExists) => {
                    warp::reply::with_status("User Exists", StatusCode::BAD_REQUEST)
                }
                Some(Errors::InvalidRequest(req)) => {
                    warp::reply::with_status(*req, StatusCode::BAD_REQUEST)
                }
                Some(Errors::DbError(e)) => {
                    println!("{:?}", e);
                    warp::reply::with_status("DB Error", StatusCode::INTERNAL_SERVER_ERROR)
                }
                _ => {
                    return Err(err);
                }
            })
        });

    let ip_tuple = (
        [0, 0, 0, 0],
        env::var("PORT")
            .ok()
            .and_then(|p| str::parse(&p).ok())
            .unwrap_or_else(|| 8000),
    );

    let server = warp::serve(routes);
    server.run(ip_tuple).compat().await;
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserModel {
    username: String,
    class_name: String,
    weights: Vec<i32>,
}

#[derive(Serialize, Deserialize)]
struct AuthModel {
    id: Uuid,
}

#[derive(Debug)]
enum Errors {
    Unauthorized,
    #[allow(unused)]
    InvalidRequest(&'static str),
    UserExists,
    DbError(sqlx::Error),
}

impl warp::reject::Reject for Errors {}

impl From<Errors> for Rejection {
    fn from(e: Errors) -> Rejection {
        warp::reject::custom(e)
    }
}
