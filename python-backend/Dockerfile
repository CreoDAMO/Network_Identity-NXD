# Multi-stage build with Rust support for NXD Platform Python Backend
FROM rust:1.75 as rust-builder

WORKDIR /app

# Copy Rust components
COPY rust-components/ ./rust-components/

# Build Rust components
WORKDIR /app/rust-components
RUN cargo build --release

# Python stage
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nxd && useradd -r -g nxd nxd

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Rust build artifacts
COPY --from=rust-builder /app/rust-components/target/release/ ./rust-components/target/release/

# Copy Python application
COPY . .

# Set ownership
RUN chown -R nxd:nxd /app

# Switch to non-root user
USER nxd

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]