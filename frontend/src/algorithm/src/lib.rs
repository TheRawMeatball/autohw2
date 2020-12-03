use js_sys::Array;
use wasm_bindgen::prelude::*;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
// In the tuple, first element is weight for x, and second is the amount of homework due x+1.
// Once the function returns, the weights will not be altered, but, the second will be the amount
// of homework that should be done on day x.
export function run_algorithm(a: [number, number][]): [number, number][];
"#;

#[wasm_bindgen(skip_typescript)]
pub fn run_algorithm(a: Array) -> Array {
    let mut list: Vec<_> = a
        .to_vec()
        .iter()
        .map(|v| {
            let v = Array::from(v).to_vec();
            let mut t = v
                .iter()
                .map(JsValue::as_f64)
                .map(Option::unwrap)
                .map(|v| v as i32);
            (t.next().unwrap(), t.next().unwrap())
        })
        .collect();
    distribute(&mut list);
    list.iter()
        .map(|i| {
            [JsValue::from(i.0), JsValue::from(i.1)]
                .iter()
                .collect::<Array>()
        })
        .collect::<Array>()
}

fn distribute(work: &mut [(i32, i32)]) {
    for day in 0..work.len() {
        let day_load = work[day].1;
        work[day].1 = 0;
        'day_loop: for start in 0..=day {
            let slice = &mut work[start..=day];
            for partial in 0..slice[0].0 {
                let ws = slice[0];
                let partial_load =
                    (ws.0 - partial) * (ws.1 / ws.0) + ((ws.1 % ws.0) - partial).max(0);

                let load = day_load + partial_load + slice[1..].iter().map(|x| x.1).sum::<i32>();
                let effective_len = slice.iter().map(|x| x.0).sum::<i32>() - partial;
                let max = slice[1..]
                    .iter()
                    .map(|&(w, l)| {
                        if w == 0 {
                            0
                        } else {
                            l / w + i32::min(l % w, 1)
                        }
                    })
                    .max()
                    .unwrap_or(0)
                    .max((ws.1 / ws.0) + ((ws.1 % ws.0) - partial).max(0));

                if load / effective_len >= max {
                    slice[0].1 += (load / effective_len) * (slice[0].0 - partial) - partial_load;

                    for x in slice[1..].iter_mut() {
                        x.1 = x.0 * (load / effective_len);
                    }

                    let mut excess = load % effective_len;

                    for x in slice.iter_mut().take((load % effective_len) as usize) {
                        x.1 += x.0.min(excess);
                        excess -= x.0.min(excess);

                        if excess == 0 {
                            break;
                        }
                    }

                    break 'day_loop;
                }
            }
        }
    }
}
