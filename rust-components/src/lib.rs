use pyo3::prelude::*;

mod domain_scorer;

use domain_scorer::DomainScorer;

#[pymodule]
fn nxd_rust_components(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<DomainScorer>()?;
    Ok(())
}