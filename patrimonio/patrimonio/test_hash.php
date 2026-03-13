<?php
$password = 'senai123';
$hash = '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUEN';

if (password_verify($password, $hash)) {
    echo "VERIFIED: Hash matches 'senai123'\n";
} else {
    echo "FAILED: Hash does NOT match 'senai123'\n";
}
?>
