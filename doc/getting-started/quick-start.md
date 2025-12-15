# Quick Start Tutorial

Get up and running with Prompt Playground in minutes. This tutorial walks you through creating your first project, prompt, and evaluation.

## Prerequisites

Ensure you have completed the [Development Setup](./development-setup.md) or have the application running via Docker.

## Step 1: Create a Project

Projects are the top-level organizational unit in Prompt Playground.

1. Open the application at http://localhost:3000
2. Click **"New Project"**
3. Enter project details:
   - **Name:** `Customer Support Bot`
   - **Description:** `AI-powered customer support assistant`
4. Click **Create**

## Step 2: Create a Use Case

Use cases group related prompts within a project.

1. Click on your new project
2. Click **"New Use Case"**
3. Enter:
   - **Name:** `FAQ Responses`
   - **Description:** `Handle common customer questions`
4. Click **Create**

## Step 3: Create a Prompt

1. Click on the use case
2. Click **"New Prompt"**
3. Enter:
   - **Name:** `General FAQ Handler`
   - **Tags:** `faq`, `support`
4. Click **Create**

## Step 4: Add a Prompt Version

1. Click on the prompt to open it
2. Click **"New Version"**
3. Choose **Text** template type
4. Enter the template:

```
You are a helpful customer support assistant for {{company_name}}.

Customer Question: {{question}}

Please provide a friendly, accurate response. If you don't know the answer,
politely explain that you'll escalate the question to a human agent.
```

5. Add a commit message: `Initial FAQ handler template`
6. Click **Create Version**

## Step 5: Test the Prompt

1. In the prompt detail view, click the **Playground** tab
2. In the **Variables** panel on the right:
   - Set `company_name`: `Acme Inc`
   - Set `question`: `What are your business hours?`
3. Select a model (e.g., `gpt-4o-mini`)
4. Click **Run**
5. View the response in the output panel

### Try Different Variables

Experiment with different inputs:

| company_name | question |
|--------------|----------|
| TechCorp | How do I reset my password? |
| FoodMart | Do you offer delivery? |
| CloudSoft | What's your refund policy? |

## Step 6: Compare Models

1. Click **Add Model** to add additional models
2. Select different models (e.g., `gpt-4o`, `claude-3-5-sonnet`)
3. Click **Run All**
4. Compare outputs side-by-side

## Step 7: Create a Dataset

Datasets enable batch testing with multiple inputs.

1. Navigate to **Datasets** in the sidebar
2. Click **"New Dataset"**
3. Enter:
   - **Name:** `FAQ Test Cases`
   - **Description:** `Common FAQ questions for testing`
4. Click **Create**

## Step 8: Add Dataset Items

1. Click on the dataset
2. Click **"Add Item"**
3. Enter the input JSON:

```json
{
  "company_name": "Acme Inc",
  "question": "What are your business hours?"
}
```

4. Optionally add expected output
5. Click **Add**

Repeat to add more test cases:

```json
{
  "company_name": "Acme Inc",
  "question": "How do I contact support?"
}
```

```json
{
  "company_name": "Acme Inc",
  "question": "What payment methods do you accept?"
}
```

## Step 9: Run an Evaluation

1. Navigate to your prompt
2. Click **"Run Evaluation"**
3. Configure:
   - **Prompt Version:** Version 1
   - **Dataset:** FAQ Test Cases
   - **Models:** Select one or more models
4. Click **Start Evaluation**

## Step 10: View Results

1. Navigate to **Evaluations** in the sidebar
2. Click on your evaluation run
3. Review:
   - **Summary statistics** (pass rate, average latency)
   - **Individual results** for each test case
   - **Metrics** (tokens, cost, latency)

### Export Results

- Click **Export JSON** for raw data
- Click **Export Markdown** for readable reports

## Working with Chat Templates

For conversational AI, use chat templates:

1. Create a new prompt version
2. Select **Chat** template type
3. Add messages:

**System message:**
```
You are a helpful customer support assistant for {{company_name}}.
Always be polite and professional.
```

**User message:**
```
{{question}}
```

4. Test with variables as before

## Best Practices

### Organizing Prompts

- Use **projects** for major product areas
- Use **use cases** for specific features
- Use **tags** for cross-cutting concerns (tone, audience, etc.)

### Version Control

- Write descriptive **commit messages**
- Use **labels** to mark production-ready versions
- Keep experimental changes in unlabeled versions

### Testing Strategy

- Create **diverse test cases** covering edge cases
- Include **expected outputs** for automated validation
- Run evaluations **before promoting** to production

### Model Selection

- Start with **faster, cheaper models** (gpt-4o-mini)
- Compare with **premium models** for quality checks
- Document **model preferences** per use case

## Next Steps

Now that you've completed the basics:

1. Explore [Template Syntax](../guides/template-syntax.md) for advanced patterns
2. Learn about [Assertions](../guides/running-evaluations.md) for automated grading
3. Read the [API Reference](../api/overview.md) for programmatic access
4. Review [Multi-Model Comparison](../guides/multi-model-comparison.md) strategies

## Common Tasks Reference

| Task | Navigation |
|------|------------|
| Create project | Home → New Project |
| Add prompt | Project → Use Case → New Prompt |
| Test prompt | Prompt → Playground tab |
| Compare models | Playground → Add Model → Run All |
| Run evaluation | Prompt → Run Evaluation |
| View results | Evaluations → Select run |
| Export data | Eval Run → Export JSON/Markdown |

---

*Questions? Check the [full documentation](../README.md) or open an issue.*
