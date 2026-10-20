## Ticket
<!-- Link, e.g. LIN-123. Write "retroactive" if the ticket came after the work. -->

## What changed

## Why

## How it was tested
- [ ] Lint, typecheck and tests pass locally
- [ ] Ran the change by hand where it is used (UI, CLI, API or calling code); screenshot or output attached if useful
- [ ] New behavior has a test that fails without the change

## Risk and rollback
<!-- What could break? How do we undo it: revert, flag off, redeploy or re-release the previous version? Any migration? -->

## Security
- [ ] No secrets in code, logs, or anything shipped to users
- [ ] Inputs validated and permissions checked on any new entry point (endpoint, command, public function)
- [ ] No new dependencies, or each new one is named here with why
