import os
import shutil
import secrets
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from deepzoom import ImageCreator
from PIL import Image
import io
import urllib

# -----------------------------
# CONFIG
# -----------------------------
INPUT_IMAGE = "../../tree(2).png"          # your large diagram
OUTPUT_DIR = ""
DZI_NAME = "tree"
PASSWORD = b"54FlyingFish"  # replace with real password

TILE_SIZE = 510
OVERLAP = 1
FORMAT = "png"

# -----------------------------
# GENERATE DZI + TILES
# -----------------------------
def generate_dzi():
    tiles_dir = Path(OUTPUT_DIR) / f"{DZI_NAME}_files"
    if os.path.exists(tiles_dir):
        shutil.rmtree(tiles_dir)

    creator = ImageCreator(
        tile_size=TILE_SIZE,
        tile_overlap=OVERLAP,
        tile_format=FORMAT,
        image_quality=0.9
    )

    Image.MAX_IMAGE_PIXELS = 10000000000
    source = Image.open(INPUT_IMAGE)

    creator.create(source, os.path.join(OUTPUT_DIR, DZI_NAME + ".dzi"))


generate_dzi()

# -----------------------------
# KEY DERIVATION (PBKDF2)
# -----------------------------
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(password: bytes) -> bytes:
    salt = b"dzi-encryption-salt"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password)

key = derive_key(PASSWORD)
aesgcm = AESGCM(key)

# -----------------------------
# ENCRYPTION HELPER
# -----------------------------
def encrypt_bytes(data: bytes) -> bytes:
    iv = secrets.token_bytes(12)
    ciphertext = aesgcm.encrypt(iv, data, None)
    return iv + ciphertext


# -----------------------------
# ENCRYPT DZI XML
# -----------------------------
dzi_path = Path(OUTPUT_DIR) / f"{DZI_NAME}.dzi"
dzi_xml = dzi_path.read_bytes()
dzi_enc = encrypt_bytes(dzi_xml)
(dzi_path.parent / (dzi_path.name + ".enc")).write_bytes(dzi_enc)

# Remove plaintext DZI
dzi_path.unlink()

# -----------------------------
# ENCRYPT ALL TILE IMAGES
# -----------------------------
tiles_dir = Path(OUTPUT_DIR) / f"{DZI_NAME}_files"

for root, dirs, files in os.walk(tiles_dir):
    for file in files:
        if file.endswith("." + FORMAT):
            full = Path(root) / file
            data = full.read_bytes()
            enc = encrypt_bytes(data)
            enc_path = full.with_suffix(full.suffix + ".enc")
            enc_path.write_bytes(enc)
            full.unlink()

print("DZI + tiles generated and encrypted successfully.")