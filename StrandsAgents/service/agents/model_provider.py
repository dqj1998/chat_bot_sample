import os

try:
    from strands.models import BedrockModel
    from strands.models.ollama import OllamaModel
    from strands.models.openai import OpenAIModel
except Exception:
    BedrockModel = None  # type: ignore
    OllamaModel = None  # type: ignore
    OpenAIModel = None  # type: ignore


def build_model():
    provider = os.getenv("STRANDS_LLM_PROVIDER", "ollama")

    if provider == "ollama":
        if OllamaModel is None:
            raise RuntimeError("strands-agents not installed correctly for OllamaModel")
        return OllamaModel(
            host=os.getenv("STRANDS_OLLAMA_BASE_URL", "http://localhost:11434"),
            model_id=os.getenv("STRANDS_OLLAMA_MODEL", "llama3"),
        )

    if provider == "aws":
        if BedrockModel is None:
            raise RuntimeError("strands-agents not installed correctly for BedrockModel")
        return BedrockModel(
            model_id=os.getenv("STRANDS_AWS_MODEL", "us.amazon.nova-pro-v1:0"),
            region=os.getenv("STRANDS_AWS_REGION", "us-west-2"),
        )

    if provider == "openai_compat":
        if OpenAIModel is None:
            raise RuntimeError("strands-agents not installed correctly for OpenAIModel")
        return OpenAIModel(
            base_url=os.getenv("STRANDS_OPENAI_BASE_URL", "https://api.openai.com/v1"),
            api_key=os.getenv("STRANDS_OPENAI_API_KEY"),
            model_id=os.getenv("STRANDS_OPENAI_MODEL", "gpt-4o-mini"),
        )

    raise ValueError(f"Unsupported STRANDS_LLM_PROVIDER: {provider}")
