FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r requirements.txt
COPY engine.py server.py replay.py ./
RUN useradd -m worker && mkdir /app/artifacts && chown worker /app/artifacts
USER worker
ENV ML_BIND=0.0.0.0 ML_DATA_DIR=/data ML_ARTIFACT_DIR=/app/artifacts
CMD ["python","server.py"]
