<?php
echo "PHP is working!\n";
echo "Testing database connection...\n";

$conn = new mysqli('127.0.0.1', 'root', '', 'mimatcha_db', 3308);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Database connected!\n";

$result = $conn->query("SELECT COUNT(*) as total FROM produk");
$row = $result->fetch_assoc();
echo "Total products: " . $row['total'] . "\n";
?>