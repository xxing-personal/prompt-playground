# Template Syntax Guide

This guide explains how to write prompt templates with variable substitution in Prompt Playground.

## Overview

Templates allow you to create reusable prompts with dynamic content. Variables are placeholders that get replaced with actual values at runtime.

## Basic Syntax

### Variable Declaration

Use double curly braces to declare variables:

```
Hello, {{name}}!
```

When executed with `name = "World"`, this becomes:

```
Hello, World!
```

### Variable Naming Rules

- Use letters, numbers, and underscores
- Start with a letter or underscore
- Case-sensitive (`Name` and `name` are different)

**Valid:**
```
{{user_name}}
{{firstName}}
{{item_1}}
{{_private}}
```

**Invalid:**
```
{{1item}}      // Can't start with number
{{user-name}}  // No hyphens
{{user name}}  // No spaces
```

---

## Template Types

### Text Templates

Single-block text templates for simple prompts:

```
You are a helpful assistant for {{company_name}}.

The user's question is: {{question}}

Please provide a {{tone}} response that is {{length}} in length.
```

**Variables:**
- `company_name`: Company name
- `question`: User's question
- `tone`: Response tone (friendly, professional, etc.)
- `length`: Response length (brief, detailed, etc.)

### Chat Templates

Multi-message templates for conversational contexts:

**System Message:**
```
You are a helpful customer support assistant for {{company_name}}.
You specialize in {{specialty}}.
Always be {{tone}} and professional.
```

**User Message:**
```
{{customer_message}}
```

**Assistant Message (optional, for few-shot examples):**
```
Based on your question about {{topic}}, here's what I can help with...
```

---

## Common Patterns

### Context Injection

Provide background information:

```
You are an expert in {{domain}}.

Context Information:
{{context}}

Based on the above context, please answer:
{{question}}
```

### Role Definition

Define the AI's persona:

```
You are {{role_name}}, a {{role_description}}.

Your key traits:
- {{trait_1}}
- {{trait_2}}
- {{trait_3}}

Respond as this character would to: {{user_input}}
```

### Few-Shot Examples

Include examples for better results:

```
Convert the following text to {{target_format}}.

Examples:
Input: {{example_input_1}}
Output: {{example_output_1}}

Input: {{example_input_2}}
Output: {{example_output_2}}

Now convert this:
Input: {{user_input}}
Output:
```

### Structured Output

Request specific output formats:

```
Analyze the following text and respond in JSON format:

Text: {{input_text}}

Response Format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "key_points": ["point1", "point2"],
  "summary": "brief summary"
}
```

### Conditional Sections

While templates don't support conditionals directly, you can use variables for optional content:

```
{{system_instructions}}

{{optional_context}}

Question: {{question}}
```

Leave `optional_context` empty when not needed.

---

## Best Practices

### 1. Use Descriptive Variable Names

**Good:**
```
{{customer_support_query}}
{{product_category}}
{{response_language}}
```

**Bad:**
```
{{q}}
{{x}}
{{temp}}
```

### 2. Provide Clear Context

**Good:**
```
You are a technical support agent for {{company_name}}, a {{company_type}} company.

The customer is experiencing: {{issue_description}}

Their product version is: {{product_version}}

Please provide troubleshooting steps.
```

**Bad:**
```
Fix this: {{issue}}
```

### 3. Set Explicit Expectations

**Good:**
```
Provide your response in exactly this format:
1. Summary (2-3 sentences)
2. Key Points (bullet list)
3. Recommendation (1 paragraph)

Do not include any other content.
```

**Bad:**
```
Summarize this: {{text}}
```

### 4. Handle Edge Cases

```
Analyze the following customer feedback. If the feedback is empty or unclear,
respond with "Unable to analyze - insufficient data."

Feedback: {{feedback}}
```

### 5. Version Your Templates

Include version comments:

```
{# Template v2.1 - Added multi-language support #}

You are a customer support assistant who speaks {{language}}.
...
```

---

## Variable Types

### Simple Text

```json
{
  "name": "John Doe",
  "question": "What are your business hours?"
}
```

### Multiline Text

```json
{
  "context": "This is line one.\nThis is line two.\nThis is line three."
}
```

### Lists (as text)

```json
{
  "requirements": "- Must be under 100 words\n- Must be professional\n- Must include a call to action"
}
```

### JSON in Variables

For complex structured data:

```json
{
  "user_profile": "{\"name\": \"John\", \"role\": \"admin\", \"department\": \"Sales\"}"
}
```

---

## Chat Message Templates

### Message Structure

```json
[
  {
    "role": "system",
    "content": "You are {{assistant_type}}."
  },
  {
    "role": "user",
    "content": "{{user_message}}"
  }
]
```

### Multi-Turn Conversations

```json
[
  {
    "role": "system",
    "content": "You are a helpful coding assistant."
  },
  {
    "role": "user",
    "content": "{{first_question}}"
  },
  {
    "role": "assistant",
    "content": "{{first_answer}}"
  },
  {
    "role": "user",
    "content": "{{follow_up}}"
  }
]
```

### System Message Patterns

**Basic:**
```
You are a helpful assistant.
```

**Detailed:**
```
You are {{role}}, an AI assistant specialized in {{domain}}.

Your responsibilities:
{{responsibilities}}

Guidelines:
{{guidelines}}

Important constraints:
{{constraints}}
```

---

## Examples

### Customer Support Template

```
System: You are a customer support representative for {{company_name}}.

Company Info:
- Industry: {{industry}}
- Products: {{products}}
- Support Hours: {{support_hours}}

Guidelines:
1. Be helpful and empathetic
2. If you don't know something, admit it
3. Always offer to escalate if needed

User: {{customer_query}}
```

**Variables:**
```json
{
  "company_name": "TechCorp",
  "industry": "Software as a Service",
  "products": "Cloud Storage, Email, Project Management",
  "support_hours": "24/7",
  "customer_query": "I can't access my files"
}
```

### Content Generation Template

```
Write a {{content_type}} about {{topic}}.

Target Audience: {{audience}}
Tone: {{tone}}
Length: {{word_count}} words
Key Points to Cover:
{{key_points}}

Additional Requirements:
{{additional_requirements}}
```

### Code Review Template

```
Review the following {{language}} code:

```{{language}}
{{code}}
```

Focus Areas:
{{focus_areas}}

Output Format:
1. Summary of the code's purpose
2. Potential issues (with line numbers)
3. Suggestions for improvement
4. Security considerations
```

---

## Troubleshooting

### Missing Variables

**Error:** `Missing variable: customer_name`

**Solution:** Ensure all template variables are provided:

```json
// Required
{
  "customer_name": "John",
  "question": "Help me"
}

// Template uses: {{customer_name}}, {{question}}
```

### Special Characters

Variables are inserted as-is. If you need escaping:

```json
{
  "code": "function() {\n  return \"hello\";\n}"
}
```

### Variable Not Replaced

Check spelling and case sensitivity:

```
Template: Hello {{userName}}
Variables: {"username": "John"}  // Wrong case!
```

---

## Schema Validation

Define expected variable types:

```json
{
  "type": "object",
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Customer's full name"
    },
    "question": {
      "type": "string",
      "description": "Customer's question"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Ticket priority level"
    }
  },
  "required": ["customer_name", "question"]
}
```

---

## Related Documentation

- [API: Playground](../api/playground.md)
- [Quick Start](../getting-started/quick-start.md)
- [Running Evaluations](./running-evaluations.md)

---

*Template syntax documentation generated December 2024*
