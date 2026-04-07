set -e

echo "=== Building Spring Boot API ==="

# Check if Maven is installed, if not install it
if ! command -v mvn &> /dev/null; then
    echo "Maven not found. Installing..."
    apt-get update
    apt-get install -y maven
fi

# Build the project
mvn clean install -DskipTests

echo "=== Build complete ==="
