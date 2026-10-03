# My Code Style Guide

A language-agnostic reference for how I like code written — high-level decisions (testing, architecture, error handling) down to small ones (naming, function shape). Work in progress, built iteratively.

## Naming

- Names should be **descriptive and intention-revealing** — you should be able to understand as much as possible just from the name of a variable, function, class, or module.
- Prefer **concise but complete** names. When concision and clarity conflict, clarity wins: prefer length over ambiguity.
- This applies even in small/short-lived scopes. A loop counter should still say what it's counting, not just that it's an index:
  ```python
  # Not this:
  for i in range(len(fruits)):
      ...
  for index in range(len(fruits)):
      ...

  # This:
  for fruit_index in range(len(fruits)):
      ...
  ```
- No lambdas / anonymous functions. Any action deserves a real, named function — the name documents what the action *is*.
- Booleans: lean toward `isX` / `hasX` / `shouldX` prefixes — not a hard rule, but the default, since it almost always reads most naturally.

## Comments

- Comments are avoided by default. The goal is for naming, function structure, and types to carry all the information — the code should document itself.
- A comment is justified when it explains a **non-obvious design decision** — the *why*, not the *what* — something the code itself can't convey.
- No docstrings on internal functions (anything called from within the same codebase/module-to-module) — good naming and types replace them.
  - Exception: functions that form a **public API boundary of a library** meant for external consumers get docstrings, since the caller can't read the implementation. This is not an excuse for weaker naming or typing there either.
- No TODO comments.

## Testing

*(TBD)*

## Error Handling

*(TBD)*

## Functions

- The trigger for splitting a function is **single responsibility** — not line count or nesting directly. Length (~10 LOC) and nesting depth are useful *smells* that responsibility is being violated, but they're soft signals, not hard rules. A function can be long and still be one responsibility (rare), and a short function can still be doing two things:
  ```python
  # Bad — mixes "compute one employee's pay" with "sum across employees",
  # even though it's short and barely nested:
  def get_total_employees_salary(employees: list[Employee]) -> float:
      total = 0
      for employee in employees:
          total += employee.hourly_rate * employee.total_hours
      return total

  # Better — each function is one responsibility, and naming is exact
  # about what's being computed:
  def get_total_salary(employee: Employee) -> float:
      return employee.hourly_rate * employee.total_hours

  def get_total_salaries_ever_paid(employees: list[Employee]) -> float:
      return sum(get_total_salary(employee) for employee in employees)
  ```
- "One level of abstraction per function" is the goal, but a "level" is judged by *intent*, not by literally counting high/low-level operations. A function can use low-level operations (string splitting, comparisons) and still be a single level if that's genuinely the natural unit of the responsibility (e.g. "validation"):
  ```python
  def is_valid_email(email: str) -> bool:
      has_at_symbol = "@" in email
      domain = email.split("@")[-1]
      has_domain_dot = "." in domain
      return has_at_symbol and has_domain_dot
  ```
  Here, splitting into named local variables — not separate functions — is enough to express the sub-concepts clearly.
- **Input mutation**: mutating a parameter is fine, but only if it's made explicit rather than silent. Follows Python's own convention for signaling this via the verb — `sort()` mutates in place, `sorted()` returns a new list — rather than hiding it and letting the caller find out the hard way.
- **`*args` / `**kwargs`**: useful when the number of arguments is genuinely unknown (e.g. `def send_notification(*recipients: User)`), but not as a way to force keyword-only arguments — that's what a bare `*` in the signature is for:
  ```python
  def get_elevator_max_kg_load(
      *, surface_area_square_meters: float, wire_length_meters: float, rope_max_stress: float
  ) -> float:
      ...

  # Now this is a TypeError, enforced by the interpreter:
  get_elevator_max_kg_load(4.3, 6.1, 7.4)
  # This is required:
  get_elevator_max_kg_load(surface_area_square_meters=4.3, wire_length_meters=6.1, rope_max_stress=7.4)
  ```
  Reach for keyword-only args whenever a call site with plain positional args would be unreadable (can't tell what each number means without opening the function definition).
- **Recursion vs. iteration**: iterate by default. Recursion adds cognitive load and is rarely worth it in practice — only use it when it provides a genuine, meaningful benefit over iteration, and make sure it's well-written and readable when it does.
- **Higher-order functions**: passing a real, named function as an argument (e.g. `sorted(users, key=get_last_name)`) is fine and encouraged — the objection is specifically to anonymous lambdas, not to functions-as-values in general.
- **Naming verbs**: verbs should tell the caller what to expect. Rough convention: `get` = cheap/local, always returns; `fetch` = I/O-bound (network, disk), may be slow or fail; `calculate`/`compute` = derived from other values; `build`/`create` = constructs something new. `get` should not be used for things that hit the network or disk — that's what `fetch` is for.
- **Return type consistency**: generally leans toward a function returning a single consistent type/shape across all its branches. Returning `None` on a "not found" path is sometimes the right call, but not a default — only when it doesn't make the function harder to use than a raised exception would.
- **Function visibility**: uses Python's leading-underscore convention (`_helper`) to mark internal/private functions within a module. Doesn't rely on OOP-enforced public/private (rarely uses OOP), but likes the convention as a naming signal at the module level.
- Only extract a block into its own function when it gives a **real benefit**: better readability via naming, single responsibility, or separation of concerns. Extraction with no such benefit is just ceremony — skip it. But if a function is clearly doing multiple things and extraction *doesn't* clean it up well (e.g. it leans on mutating several shared collections), that's a sign the real fix is elsewhere — a better data structure or different architecture, not extraction for its own sake.
- Nesting: up to 3 levels is fine, 4+ is usually a smell — soft rule, not a hard cutoff.
- Parameters: no hard max, but ~5+ is a smell. Prefer grouping related parameters into a dataclass, a Pydantic `BaseModel`, or a dict rather than a long parameter list.
- Prefers early returns / guard clauses over a single exit point, but this isn't a hard rule — readability comes first.
- Not a fan of one-liner functions in general *(flagged to dig into separately)*.
- **Command-query separation**: default to keeping "do something" and "answer something" as separate functions. Combine them (e.g. have a save function return the new id directly) only when *all* of these hold: getting the value separately would mean re-deriving/re-fetching something the action already produced, that re-fetch would be meaningfully expensive, and performance actually matters in context. Otherwise, split — e.g. `save_user()` returning nothing, plus a separate `get_user_id()`.
- **Boolean flag parameters are a smell** — a flag that silently switches a function's behavior (e.g. `save_user(user, notify=True)`) should usually become two named functions, composed explicitly at the call site instead of hidden behind a branch:
  ```python
  def register_user(user: User) -> None:
      save_user(user)
      if user.wants_notification:
          send_welcome_email(user)
  ```
- **Side effects**: prefers functions without side effects where possible — side-effecting functions are inherently more bug-prone to use correctly than ones that just compute and return a value.
- **Function ordering in a file**: no strong opinion on principle, but the personal default is helpers defined *above* the functions that call them (bottom-up) — that's the convention at work and what's comfortable to read, so use that as the default here too.
- **Default parameter values**: the rule of thumb is consistency, not a blanket stance. If a value is something no caller in the source realistically needs to vary (e.g. a `REQUEST_TIMEOUT` constant, only ever overridden in tests), giving it a default is fine. If it's a value where different callers might legitimately want different values (e.g. a `DEFAULT_REQUEST_TIMEOUT` where some call sites do want a custom timeout), require it explicitly everywhere rather than defaulting it — don't let some callers rely on an implicit default while others override it.

## Architecture & Modules

*(TBD)*

## Object-Oriented Design

*(TBD)*
