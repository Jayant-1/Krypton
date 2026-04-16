# Multi-stage build for optimized production image

# Stage 1: Builder
FROM python:3.11.5-slim as builder

WORKDIR /tmp

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --target /tmp/packages --no-cache-dir -r requirements.txt


# Stage 2: Runtime (minimal production image)
FROM python:3.11.5-slim

WORKDIR /app

# Install runtime dependencies only (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security BEFORE copying files
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Copy Python packages from builder to app-accessible location
COPY --from=builder --chown=appuser:appuser /tmp/packages /app/packages

# Copy application code
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser requirements.txt .

# Set environment variables with app-local path
ENV PATH=/app/packages/bin:$PATH \
    PYTHONPATH=/app/packages:$PYTHONPATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    DATABASE_PATH=/app/data/research_agent.db

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Run FastAPI with uvicorn - verbose logging for debugging
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info"]
