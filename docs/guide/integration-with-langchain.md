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
tools = [HyperFormulaTool()]
agent = create_react_agent(llm, tools)

# Agent calls: hf.evaluate("=IRR(A1:A5)")
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
Email [hello.hyperformula@handsontable.com](mailto:hello.hyperformula@handsontable.com) to sign up for beta access.
:::
