# Sample Templates

This folder contains sample DOCX templates you can use to test the backend upload and document generation flow.

## Files

- `trade_contract.docx`
  - A mock trade agreement with placeholders:
    - `{{buyer}}`
    - `{{seller}}`
    - `{{trade_date}}`
    - `{{symbol}}`
    - `{{volume}}`
    - `{{price}}`
    - `{{notional}}`
    - `{{settlement_date}}`
    - `{{counterparty}}`

- `trade_confirmation.docx`
  - A mock trade confirmation with placeholders:
    - `{{confirmation_id}}`
    - `{{trade_date}}`
    - `{{counterparty}}`
    - `{{symbol}}`
    - `{{side}}`
    - `{{volume}}`
    - `{{price}}`
    - `{{notional}}`
    - `{{currency}}`
    - `{{venue}}`
    - `{{broker}}`

## How to use

1. Use `POST /templates/` in `http://localhost:8000/docs` to upload one of these files.
2. Create a schema and schema fields for the fields you want to map.
3. Add token mappings for the template using `POST /templates/{template_id}/token-mappings`.
4. Create a data record and add field values for those schema fields.
5. Call `POST /documents/generate` with the template and data record IDs.

This should produce a generated DOCX in S3 with the placeholder values replaced.
