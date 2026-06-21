/**
 * Creates a crypto module with encryption and decryption capabilities.
 * This module uses AES-GCM encryption with PBKDF2 key derivation.
 * @returns {Object} An object with encrypt and decrypt methods.
 */
const createCrypto = () => {
    // Helper functions
    // created https://www.html-code-generator.com/javascript/data-encryption-decryption-with-password
    /**
     * Converts an ArrayBuffer to a hexadecimal string.
     * @param {ArrayBuffer} buffer - The buffer to convert.
     * @returns {string} The hexadecimal representation of the buffer.
     */
    const arrayBufferToHex = (buffer) =>
        Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    /**
     * Converts a hexadecimal string to a Uint8Array.
     * @param {string} hexString - The hexadecimal string to convert.
     * @returns {Uint8Array} The resulting Uint8Array.
     */
    const hexToUint8Array = (hexString) =>
        new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    /**
     * Derives a cryptographic key from a password using PBKDF2.
     * @param {string} password - The password to derive the key from.
     * @param {Uint8Array} salt - The salt for key derivation.
     * @param {string[]} keyUsage - The intended usage of the key (e.g., ["encrypt"] or ["decrypt"]).
     * @returns {Promise<CryptoKey>} A promise that resolves to the derived key.
     */
    const deriveKey = async (password, salt, keyUsage) => {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password), {
                name: "PBKDF2"
            },
            false,
            ["deriveBits", "deriveKey"]
        );
        return window.crypto.subtle.deriveKey({
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial, {
                name: "AES-GCM",
                length: 256
            },
            false,
            keyUsage
        );
    };

    // Validation functions
    /**
     * Validates the input data type.
     * @param {any} data - The data to validate.
     * @throws {Error} If the data type is invalid.
     */
    const validateData = (data) => {
        const validTypes = ["string", "number", "boolean", "object"];
        const type = typeof data;
        if (!validTypes.includes(type) || (type === "object" && data === null)) {
            throw new Error(`Invalid data type. Expected one of ${validTypes.join(", ")}, but got ${type === "object" && data === null ? "null" : type}`);
        }
    };

    /**
     * Validates the password.
     * @param {string|number} password - The password to validate.
     * @throws {Error} If the password is invalid.
     */
    const validatePassword = (password) => {
        if (typeof password !== "string" && typeof password !== "number") {
            throw new Error("Password must be a string or a number");
        }
        if (password.toString().length < 2) {
            throw new Error("Password must be at least 2 characters");
        }
    };

    /**
     * Encrypts the given data using AES-GCM encryption.
     * @param {any} data - The data to encrypt. Can be a string, number, boolean, or object.
     * @param {string|number} password - The password to use for encryption.
     * @returns {Promise<string>} A promise that resolves to the encrypted data as a hexadecimal string.
     * @throws {Error} If the input data or password is invalid.
     */
    const encrypt = async (data, password) => {
        validateData(data);
        validatePassword(password);
        const enc = new TextEncoder();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const dataString = typeof data === "string" ? data : JSON.stringify(data);
        const dataBytes = enc.encode(dataString);
        const key = await deriveKey(password.toString(), salt, ["encrypt"]);
        const encryptedData = await window.crypto.subtle.encrypt({
                name: "AES-GCM",
                iv
            },
            key,
            dataBytes
        );
        // Combine salt, iv, and encrypted data into a single Uint8Array
        const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encryptedData), salt.length + iv.length);
        return arrayBufferToHex(result.buffer);
    };

    /**
     * Decrypts the given encrypted data using AES-GCM decryption.
     * @param {string} encryptedText - The encrypted data as a hexadecimal string.
     * @param {string|number} password - The password to use for decryption.
     * @returns {Promise<any>} A promise that resolves to the decrypted data. If the original data was JSON, it will be parsed.
     * @throws {Error} If the encrypted text or password is invalid.
     */
    const decrypt = async (encryptedText, password) => {
        if (typeof encryptedText !== "string") {
            throw new Error("encryptedText must be a string");
        }
        validatePassword(password);
        const data = hexToUint8Array(encryptedText);
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const encryptedContent = data.slice(28);
        const key = await deriveKey(password.toString(), salt, ["decrypt"]);
        const decryptedData = await window.crypto.subtle.decrypt({
                name: "AES-GCM",
                iv
            },
            key,
            encryptedContent
        );
        const dec = new TextDecoder();
        const decryptedString = dec.decode(decryptedData);
        // Attempt to parse the decrypted data as JSON, return as string if parsing fails
        try {
            return JSON.parse(decryptedString);
        } catch (e) {
            return decryptedString;
        }
    };
    return {
        encrypt,
        decrypt
    };
};