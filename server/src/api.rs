use chrono::{Duration, NaiveDate, Utc};
use http::header;
use serde::{Deserialize, Serialize};
use sqlx::{query_file, query_file_as};
use std::convert::Infallible;
use uuid::Uuid;
use warp::{Filter, Rejection, Reply};

use crate::{AuthModel, DbConn, Errors, UserModel};

pub fn routes(db: DbConn) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let filters = {
        let db = warp::any().map(move || db.clone());
        let auth = warp::cookie::optional("auth-token")
            .and(db.clone())
            .and_then(|cookie: Option<String>, db: DbConn| async move {
                let token: Uuid = cookie
                    .and_then(|s| str::parse(&s).ok())
                    .ok_or(Errors::Unauthorized)?;
                let threshold = Utc::now().naive_local() - Duration::seconds(60 * 60 * 60 * 7);
                Ok::<AuthModel, Rejection>(
                    query_file_as!(AuthModel, "queries/use_refresh.sql", token, threshold)
                        .fetch_optional(&db)
                        .await
                        .map_err(|e| Errors::DbError(e))?
                        .ok_or(Errors::Unauthorized)?,
                )
            });

        auth.and(db)
    };

    let me = warp::path!("me")
        .and(warp::get())
        .and(filters.clone())
        .and_then(|m: AuthModel, db| async move {
            let model = query_file_as!(UserModel, "queries/me.sql", m.id)
                .fetch_one(&db)
                .await
                .map_err(|e| Errors::DbError(e))?;

            Ok::<_, Rejection>(warp::reply::json(&model))
        });

    let add_hw = warp::path!("add-homework")
        .and(warp::post())
        .and(filters.clone())
        .and(warp::body::json())
        .and_then(
            |m: AuthModel, db: DbConn, hw: AddHomeworkModel| async move {
                let (user_id, class_id) = if !hw.for_self {
                    (None, Some(m.id))
                } else {
                    (Some(m.id), None)
                };
                let id = query_file!(
                    "queries/add_homework.sql",
                    hw.detail,
                    hw.subject,
                    class_id,
                    user_id,
                    hw.amount,
                    hw.due_date
                )
                .fetch_one(&db)
                .await
                .map_err(|e| Errors::DbError(e))?
                .id;
                Ok::<_, Rejection>(warp::reply::json(&HomeworkModel {
                    id,
                    detail: hw.detail,
                    amount: hw.amount,
                    subject: hw.subject,
                    due_date: hw.due_date,
                    progress: 0,
                    weight: 1,
                    delta: 0,
                    personal: hw.for_self,
                    extended_due_date: None,
                }))
            },
        );

    let get_hw = warp::path!("get-homework")
        .and(warp::get())
        .and(filters.clone())
        .and_then(|m: AuthModel, db: DbConn| async move {
            let mut transaction = db.begin().await.map_err(|e| Errors::DbError(e))?;
            query_file!("queries/apply_deltas.sql", m.id)
                .execute(&mut transaction)
                .await
                .map_err(|e| Errors::DbError(e))?;
            query_file!("queries/get_homework/0.sql", m.id)
                .execute(&mut transaction)
                .await
                .map_err(|e| Errors::DbError(e))?;
            let homework = query_file_as!(HomeworkModel, "queries/get_homework/1.sql", m.id)
                .fetch_all(&mut transaction)
                .await
                .map_err(|e| Errors::DbError(e))?;
            transaction.commit().await.map_err(|e| Errors::DbError(e))?;

            Ok::<_, Rejection>(warp::reply::json(&homework))
        });

    let update_hw = warp::path!("update-homework")
        .and(warp::put())
        .and(filters.clone())
        .and(warp::body::json())
        .and_then(
            |m: AuthModel, db: DbConn, model: UpdateHomeworkModel| async move {
                let mut transaction = db.begin().await.map_err(|e| Errors::DbError(e))?;

                let (user_amount, class_amount) = match model.amount {
                    Some(UpdateFor::Me(x)) => (Some(x), None),
                    Some(UpdateFor::Class(x)) => (None, Some(x)),
                    _ => (None, None),
                };

                query_file!(
                    "queries/update_homework/user.sql",
                    user_amount,
                    model.weight,
                    model.extended_due_date,
                    model.id,
                    m.id,
                )
                .execute(&mut transaction)
                .await
                .map_err(|e| Errors::DbError(e))?;

                query_file!(
                    "queries/update_homework/class.sql",
                    class_amount,
                    model.detail,
                    model.due_date,
                    model.subject,
                    model.id,
                )
                .execute(&mut transaction)
                .await
                .map_err(|e| Errors::DbError(e))?;

                transaction.commit().await.map_err(|e| Errors::DbError(e))?;

                Ok::<_, Rejection>(warp::reply())
            },
        );

    let progress_hw = warp::path!("progress-homework")
        .and(warp::put())
        .and(filters.clone())
        .and(warp::body::json())
        .and_then(
            |m: AuthModel, db: DbConn, model: ProgressModel| async move {
                let mut transaction = db.begin().await.map_err(|e| Errors::DbError(e))?;
                query_file!("queries/apply_deltas.sql", m.id)
                    .execute(&mut transaction)
                    .await
                    .map_err(|e| Errors::DbError(e))?;
                query_file!("queries/progress.sql", model.amount, model.id, m.id)
                    .execute(&mut transaction)
                    .await
                    .map_err(|e| Errors::DbError(e))?;
                transaction.commit().await.map_err(|e| Errors::DbError(e))?;

                Ok::<_, Rejection>(warp::reply())
            },
        );

    let get_subjects = warp::path!("get-subjects")
        .and(warp::get())
        .and(filters.clone())
        .and_then(|m: AuthModel, db| async move {
            let model = query_file!("queries/get_subjects.sql", m.id)
                .fetch_all(&db)
                .await
                .map_err(|e| Errors::DbError(e))?
                .into_iter()
                .map(|r| r.subject)
                .collect::<Vec<_>>();

            Ok::<_, Rejection>(warp::reply::json(&model))
        });

    let update_user = warp::path!("update-user")
        .and(warp::post())
        .and(filters.clone())
        .and(warp::body::json())
        .and_then(|m: AuthModel, db, model: UpdateUserModel| async move {
            let class_name = model.class.map(|(g, l)| format!("{}-{}", g, l));
            let model = query_file!(
                "queries/update_user.sql",
                model.username,
                class_name,
                model
                    .password
                    .map(|p| bcrypt::hash(&p, bcrypt::DEFAULT_COST).unwrap()),
                model.weights.as_ref().map(|w| &w[..]),
                m.id
            )
            .fetch_one(&db)
            .await
            .map_err(|e| Errors::DbError(e))?;

            Ok::<_, Rejection>(warp::reply::json(&UserModel {
                username: model.username.unwrap(),
                class_name: model.class_name.unwrap(),
                weights: model._weights.unwrap(),
            }))
        });

    let delete_homework = warp::path!("delete-homework")
        .and(warp::delete())
        .and(filters.clone())
        .and(warp::body::json())
        .and_then(|m: AuthModel, db, model: DeleteHomeworkModel| async move {
            if model.for_self {
                query_file!("queries/delete_homework/user.sql", model.id, m.id)
            } else {
                query_file!("queries/delete_homework/class.sql", model.id)
            }
            .execute(&db)
            .await
            .map_err(|e| Errors::DbError(e))?;

            Ok::<_, Rejection>(warp::reply())
        });

    warp::path("api")
        .and(
            me.or(add_hw)
                .or(get_hw)
                .or(update_hw)
                .or(progress_hw)
                .or(get_subjects)
                .or(update_user)
                .or(delete_homework),
        )
        .and(warp::cookie("auth-token"))
        .and_then(|reply, cookie| async move {
            Ok::<_, Infallible>(warp::reply::with_header(
                reply,
                header::SET_COOKIE,
                format!(
                    "auth-token={}; Max-Age={}; Path=/; HttpOnly; SameSite=Strict",
                    cookie,
                    60 * 60 * 24 * 7
                ),
            ))
        })
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AddHomeworkModel {
    for_self: bool,
    detail: String,
    subject: String,
    amount: Option<i32>,
    due_date: NaiveDate,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HomeworkModel {
    id: Uuid,
    detail: String,
    subject: String,
    amount: Option<i32>,
    progress: i32,
    delta: i32,
    weight: i32,
    due_date: NaiveDate,
    personal: bool,
    extended_due_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateHomeworkModel {
    id: Uuid,
    detail: Option<String>,
    subject: Option<String>,
    amount: Option<UpdateFor>,
    weight: Option<i32>,
    due_date: Option<NaiveDate>,
    extended_due_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProgressModel {
    id: Uuid,
    amount: i32,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum UpdateFor {
    Me(i32),
    Class(i32),
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateUserModel {
    password: Option<String>,
    username: Option<String>,
    class: Option<(i32, char)>,
    weights: Option<[i32; 7]>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeleteHomeworkModel {
    id: Uuid,
    for_self: bool,
}
