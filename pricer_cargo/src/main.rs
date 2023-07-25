use std::f64::consts::PI;
use std::time::{SystemTime, UNIX_EPOCH};

use rocket::http::Header;
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Attaching CORS headers to responses",
            kind: Kind::Response
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

fn get_price_with_deviation(price: f64, genesis_timestamp: i64) -> f64 {
    let milliseconds_in_cycle: i64 = 2555200 * 1000;
    let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;
    let time_difference = current_time - genesis_timestamp;

    // Calculate the phase of the sine wave (ranging from 0 to 2 * PI)
    let phase = 2.0 * PI * (time_difference as f64) / (milliseconds_in_cycle as f64);

    // Calculate the deviation factor using the sine function (oscillating between -1 and 1)
    let deviation_factor = phase.sin();

    // Calculate the deviation amount (5% of the price) and apply it to the original price
    let deviation_amount = 0.05 * deviation_factor;

    // Calculate the final price after deviation
    let final_price = price * (1.0 + deviation_amount);

    final_price
}

#[macro_use]
extern crate rocket;

#[get("/")]
fn index() -> String {
    let price = 100.0; // Replace with the actual price value
    let genesis_timestamp = 1689618660000; 
    let price_str = format!("{}", get_price_with_deviation(price, genesis_timestamp));
    price_str
}

#[launch]
fn rocket() -> _ {
    rocket::build().attach(CORS).mount("/", routes![index])
}