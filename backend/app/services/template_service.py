import re
from typing import Dict, List, Any, Optional, Tuple


class TemplateService:
    """Service for handling prompt template operations."""
    
    VARIABLE_PATTERN = re.compile(r'\{\{(\w+)\}\}')
    
    @classmethod
    def extract_variables(cls, template: str) -> List[str]:
        """Extract variable names from a template string."""
        return list(set(cls.VARIABLE_PATTERN.findall(template)))
    
    @classmethod
    def extract_variables_from_messages(cls, messages: List[Dict[str, str]]) -> List[str]:
        """Extract variable names from chat messages."""
        variables = set()
        for msg in messages:
            content = msg.get("content", "")
            variables.update(cls.VARIABLE_PATTERN.findall(content))
        return list(variables)
    
    @classmethod
    def compile_template(cls, template: str, variables: Dict[str, Any]) -> str:
        """Compile a template by substituting variables."""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result
    
    @classmethod
    def compile_messages(
        cls, 
        messages: List[Dict[str, str]], 
        variables: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Compile chat messages by substituting variables."""
        compiled = []
        for msg in messages:
            compiled.append({
                "role": msg["role"],
                "content": cls.compile_template(msg["content"], variables)
            })
        return compiled
    
    @classmethod
    def validate_variables(
        cls, 
        template: str, 
        variables: Dict[str, Any],
        template_type: str = "text",
        messages: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate that all required variables are provided.
        Returns (is_valid, missing_variables).
        """
        if template_type == "chat" and messages:
            required = set(cls.extract_variables_from_messages(messages))
        else:
            required = set(cls.extract_variables(template))
        
        provided = set(variables.keys())
        missing = required - provided
        
        return len(missing) == 0, list(missing)
    
    @classmethod
    def dry_run(
        cls,
        template_type: str,
        template_text: Optional[str],
        template_messages: Optional[List[Dict[str, str]]],
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform a dry run compilation without calling the LLM.
        Returns the compiled prompt and validation info.
        """
        if template_type == "chat" and template_messages:
            required_vars = cls.extract_variables_from_messages(template_messages)
            is_valid, missing = cls.validate_variables(
                "", variables, "chat", template_messages
            )
            compiled = cls.compile_messages(template_messages, variables) if is_valid else None
            return {
                "type": "chat",
                "compiled_messages": compiled,
                "required_variables": required_vars,
                "provided_variables": list(variables.keys()),
                "missing_variables": missing,
                "is_valid": is_valid,
            }
        else:
            template = template_text or ""
            required_vars = cls.extract_variables(template)
            is_valid, missing = cls.validate_variables(template, variables)
            compiled = cls.compile_template(template, variables) if is_valid else None
            return {
                "type": "text",
                "compiled_text": compiled,
                "required_variables": required_vars,
                "provided_variables": list(variables.keys()),
                "missing_variables": missing,
                "is_valid": is_valid,
            }
