FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY insight ./insight
USER 65532:65532
EXPOSE 8000
ENTRYPOINT ["uvicorn", "insight.api:app", "--host", "0.0.0.0", "--port", "8000"]
