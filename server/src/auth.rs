use serde::{Deserialize, Serialize};
use sqlx::{query_file, query_file_as};
use uuid::Uuid;
use warp::http::header;
use warp::{Filter, Rejection, Reply};

use crate::{DbConn, Errors, UserModel};

pub fn routes(pool: DbConn) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let db_filter = warp::any().map(move || pool.clone());

    let root_path = warp::path("auth");
    let login = warp::path("login")
        .and(warp::path::end())
        .and(warp::body::json())
        .and(db_filter.clone())
        .and_then(|Login { username, password }, db: DbConn| async move {
            let dbuser = query_file!("queries/login.sql", username)
                .fetch_one(&db)
                .await
                .map_err(|_| Errors::Unauthorized)?;

            bcrypt::verify(password, &dbuser.password_hash)
                .map_err(|_| ())
                .and_then(|x| if x { Ok(()) } else { Err(()) })
                .map_err(|_| Errors::Unauthorized)?;

            let refresh_token = query_file!("queries/add_refresh.sql", dbuser.id)
                .fetch_one(&db)
                .await
                .map_err(|e| Errors::DbError(e))?
                .token;

            let model = query_file_as!(UserModel, "queries/me.sql", dbuser.id)
                .fetch_one(&db)
                .await
                .map_err(|e| Errors::DbError(e))?;

            Ok::<_, Rejection>(auth_reply(&model, refresh_token))
        });

    let register = warp::path("register")
        .and(warp::path::end())
        .and(warp::body::json())
        .and(db_filter.clone())
        .and_then(
            |Register {
                 username,
                 password,
                 grade,
                 letter,
             },
             db: DbConn| async move {
                if let Some(user_id) = query_file!(
                    "queries/new_user.sql",
                    username,
                    format!("{}-{}", grade, letter),
                    bcrypt::hash(&password, bcrypt::DEFAULT_COST).unwrap(),
                )
                .fetch_one(&db)
                .await
                .map_err(|e| Errors::DbError(e))?
                .new_user
                {
                    let refresh_token: Uuid = query_file!("queries/add_refresh.sql", user_id)
                        .fetch_one(&db)
                        .await
                        .map_err(|e| Errors::DbError(e))?
                        .token;

                    let model = query_file_as!(UserModel, "queries/me.sql", user_id)
                        .fetch_one(&db)
                        .await
                        .map_err(|e| Errors::DbError(e))?;

                    Ok::<_, Rejection>(auth_reply(&model, refresh_token))
                } else {
                    Err(Errors::UserExists.into())
                }
            },
        );

    let logout = warp::path("logout").and(warp::path::end()).map(|| {
        warp::reply::with_header(
            "",
            header::SET_COOKIE,
            "auth-token=_; Max-Age=0; Path=/; HttpOnly; SameSite=Strict",
        )
    });

    root_path
        .and(warp::post())
        .and(login.or(logout).or(register))
}

fn auth_reply(auth: &UserModel, r_token: impl std::fmt::Display) -> impl Reply {
    warp::reply::with_header(
        warp::reply::json(auth),
        header::SET_COOKIE,
        format!(
            "auth-token={}; Max-Age={}; Path=/; HttpOnly; SameSite=Strict",
            r_token,
            60 * 60 * 24 * 7
        ),
    )
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Login {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Register {
    username: String,
    password: String,
    grade: i32,
    letter: char,
}
