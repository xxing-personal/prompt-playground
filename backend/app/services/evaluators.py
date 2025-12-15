import re
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from abc import ABC, abstractmethod
import jsonschema


@dataclass
class AssertionResult:
    """Result of running an assertion."""
    passed: bool
    score: float  # 0.0 to 1.0
    reason: str
    assertion_type: str
    config: Dict[str, Any]


class BaseEvaluator(ABC):
    """Base class for evaluators."""
    
    @abstractmethod
    def evaluate(
        self,
        output: str,
        expected: Optional[Any],
        config: Dict[str, Any]
    ) -> AssertionResult:
        pass


class ExactMatchEvaluator(BaseEvaluator):
    """Check if output exactly matches expected."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        case_sensitive = config.get("case_sensitive", True)
        
        if expected is None:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason="No expected output provided",
                assertion_type="exact_match",
                config=config,
            )
        
        expected_str = str(expected)
        if not case_sensitive:
            passed = output.lower() == expected_str.lower()
        else:
            passed = output == expected_str
        
        return AssertionResult(
            passed=passed,
            score=1.0 if passed else 0.0,
            reason="Output matches expected" if passed else "Output does not match expected",
            assertion_type="exact_match",
            config=config,
        )


class ContainsEvaluator(BaseEvaluator):
    """Check if output contains expected substring."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        substring = config.get("substring") or expected
        case_sensitive = config.get("case_sensitive", True)
        
        if substring is None:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason="No substring to check",
                assertion_type="contains",
                config=config,
            )
        
        substring_str = str(substring)
        if not case_sensitive:
            passed = substring_str.lower() in output.lower()
        else:
            passed = substring_str in output
        
        return AssertionResult(
            passed=passed,
            score=1.0 if passed else 0.0,
            reason=f"Output {'contains' if passed else 'does not contain'} '{substring_str}'",
            assertion_type="contains",
            config=config,
        )


class RegexEvaluator(BaseEvaluator):
    """Check if output matches a regex pattern."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        pattern = config.get("pattern", "")
        flags = 0
        if not config.get("case_sensitive", True):
            flags = re.IGNORECASE
        
        try:
            match = re.search(pattern, output, flags)
            passed = match is not None
            return AssertionResult(
                passed=passed,
                score=1.0 if passed else 0.0,
                reason=f"Output {'matches' if passed else 'does not match'} pattern '{pattern}'",
                assertion_type="regex",
                config=config,
            )
        except re.error as e:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason=f"Invalid regex pattern: {e}",
                assertion_type="regex",
                config=config,
            )


class JsonValidEvaluator(BaseEvaluator):
    """Check if output is valid JSON."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        try:
            json.loads(output)
            return AssertionResult(
                passed=True,
                score=1.0,
                reason="Output is valid JSON",
                assertion_type="json_valid",
                config=config,
            )
        except json.JSONDecodeError as e:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason=f"Output is not valid JSON: {e}",
                assertion_type="json_valid",
                config=config,
            )


class JsonSchemaEvaluator(BaseEvaluator):
    """Check if output matches a JSON schema."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        schema = config.get("schema", {})
        
        try:
            parsed = json.loads(output)
        except json.JSONDecodeError as e:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason=f"Output is not valid JSON: {e}",
                assertion_type="json_schema",
                config=config,
            )
        
        try:
            jsonschema.validate(parsed, schema)
            return AssertionResult(
                passed=True,
                score=1.0,
                reason="Output matches JSON schema",
                assertion_type="json_schema",
                config=config,
            )
        except jsonschema.ValidationError as e:
            return AssertionResult(
                passed=False,
                score=0.0,
                reason=f"Output does not match schema: {e.message}",
                assertion_type="json_schema",
                config=config,
            )


class LengthEvaluator(BaseEvaluator):
    """Check if output length is within bounds."""
    
    def evaluate(self, output: str, expected: Optional[Any], config: Dict[str, Any]) -> AssertionResult:
        min_length = config.get("min_length", 0)
        max_length = config.get("max_length", float("inf"))
        
        length = len(output)
        passed = min_length <= length <= max_length
        
        return AssertionResult(
            passed=passed,
            score=1.0 if passed else 0.0,
            reason=f"Output length {length} is {'within' if passed else 'outside'} bounds [{min_length}, {max_length}]",
            assertion_type="length",
            config=config,
        )


class EvaluatorRegistry:
    """Registry of available evaluators."""
    
    EVALUATORS = {
        "exact_match": ExactMatchEvaluator,
        "contains": ContainsEvaluator,
        "regex": RegexEvaluator,
        "json_valid": JsonValidEvaluator,
        "json_schema": JsonSchemaEvaluator,
        "length": LengthEvaluator,
    }
    
    @classmethod
    def get_evaluator(cls, assertion_type: str) -> Optional[BaseEvaluator]:
        evaluator_class = cls.EVALUATORS.get(assertion_type)
        if evaluator_class:
            return evaluator_class()
        return None
    
    @classmethod
    def run_assertions(
        cls,
        output: str,
        expected: Optional[Any],
        assertions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run all assertions and return aggregated results.
        
        Returns:
            {
                "pass": bool,
                "score": float,
                "reason": str,
                "assertions": [AssertionResult, ...]
            }
        """
        if not assertions:
            return {
                "pass": True,
                "score": 1.0,
                "reason": "No assertions defined",
                "assertions": [],
            }
        
        results = []
        for assertion in assertions:
            assertion_type = assertion.get("type", "")
            config = assertion.get("config", {})
            
            evaluator = cls.get_evaluator(assertion_type)
            if evaluator:
                result = evaluator.evaluate(output, expected, config)
                results.append({
                    "type": result.assertion_type,
                    "passed": result.passed,
                    "score": result.score,
                    "reason": result.reason,
                })
            else:
                results.append({
                    "type": assertion_type,
                    "passed": False,
                    "score": 0.0,
                    "reason": f"Unknown assertion type: {assertion_type}",
                })
        
        # Aggregate results
        all_passed = all(r["passed"] for r in results)
        avg_score = sum(r["score"] for r in results) / len(results) if results else 1.0
        
        if all_passed:
            reason = "All assertions passed"
        else:
            failed = [r for r in results if not r["passed"]]
            reason = f"{len(failed)} of {len(results)} assertions failed"
        
        return {
            "pass": all_passed,
            "score": avg_score,
            "reason": reason,
            "assertions": results,
        }
