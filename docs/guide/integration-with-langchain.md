# Integration with LangChain/LangGraph

A LangChain/LangGraph tool that gives AI agents deterministic, Excel-compatible formula evaluation instead of relying on LLM-generated math.

## What it does

**Without HyperFormula:**

```python
result = llm.invoke(
    "Calculate the IRR for these cash flows: [-1000, 300, 400, 500, 200]"
)
# "The IRR is approximately 12.4%" ← non-deterministic, unverifiable
```

**With HyperFormula tool:**

```python
from langchain_core.tools import tool
from hyperformula import HyperFormula

hf = HyperFormula.build_from_array([[-1000, 300, 400, 500, 200]])

@tool
def evaluate_formula(formula: str) -> str:
    """Evaluate an Excel-compatible formula using HyperFormula."""
    return hf.calculate_formula(formula, sheet_id=0)

agent = create_react_agent(llm, [evaluate_formula])

# Agent calls: evaluate_formula("=IRR(A1:E1)")
# → 0.1189 ← deterministic, auditable
```

## How it works

1. **Agent populates a HyperFormula sheet** —writes data and formulas (`=SUM`, `=IF`, `=VLOOKUP`, etc.) into cells.
2. **HyperFormula evaluates deterministically** —resolves the full dependency graph using 400+ built-in functions. No LLM in the loop for math.
3. **Agent continues with verified data** —computed values flow back into the chain for reasoning, reporting, or downstream actions.

## Use cases

- Financial modeling (NPV, IRR, amortization)
- Data transformation and aggregation (SUMIF, VLOOKUP)
- Dynamic pricing with formula-defined logic
- What-if scenarios and forecasting
- Report generation with verified KPIs

## Beta access

::: tip
[Sign up for beta access](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
:::
