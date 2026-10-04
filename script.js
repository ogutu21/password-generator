"use strict";


// =====================================================
// PASSWORD GENERATOR
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const passwordInput = document.getElementById("password");

const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const uppercaseCheckbox = document.getElementById("uppercase");
const lowercaseCheckbox = document.getElementById("lowercase");
const numbersCheckbox = document.getElementById("numbers");
const symbolsCheckbox = document.getElementById("symbols");

const excludeAmbiguousCheckbox =
    document.getElementById("excludeAmbiguous");

const noDuplicatesCheckbox =
    document.getElementById("noDuplicates");

const generateButton =
    document.getElementById("generateButton");

const copyButton =
    document.getElementById("copyButton");

const togglePasswordButton =
    document.getElementById("togglePasswordButton");

const copyMessage =
    document.getElementById("copyMessage");

const errorMessage =
    document.getElementById("errorMessage");

const strengthText =
    document.getElementById("strengthText");

const strengthProgress =
    document.getElementById("strengthProgress");

const themeButton =
    document.getElementById("themeButton");


// =====================================================
// CHARACTER SETS
// =====================================================

const CHARACTER_SETS = {

    uppercase:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

    lowercase:
        "abcdefghijklmnopqrstuvwxyz",

    numbers:
        "0123456789",

    symbols:
        "!@#$%^&*()_+-=[]{}|;:,.<>?/"
};


// Characters that can easily be confused.

const AMBIGUOUS_CHARACTERS =
    "O0Il1|";


// =====================================================
// SECURE RANDOM NUMBER
// =====================================================

function secureRandomInt(max) {

    if (max <= 0) {
        throw new Error("Invalid random range.");
    }

    const maxUint32 = 0x100000000;

    const limit =
        maxUint32 -
        (maxUint32 % max);

    const randomArray =
        new Uint32Array(1);

    let randomValue;

    do {

        crypto.getRandomValues(randomArray);

        randomValue = randomArray[0];

    } while (randomValue >= limit);

    return randomValue % max;
}


// =====================================================
// RANDOM CHARACTER
// =====================================================

function getRandomCharacter(characters) {

    const index =
        secureRandomInt(characters.length);

    return characters[index];
}


// =====================================================
// SHUFFLE PASSWORD
// =====================================================

function secureShuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            secureRandomInt(i + 1);

        [
            array[i],
            array[randomIndex]
        ] = [
            array[randomIndex],
            array[i]
        ];
    }

    return array;
}


// =====================================================
// REMOVE AMBIGUOUS CHARACTERS
// =====================================================

function removeAmbiguousCharacters(characters) {

    let result = characters;

    for (const character of AMBIGUOUS_CHARACTERS) {

        result =
            result.split(character).join("");
    }

    return result;
}


// =====================================================
// GET SELECTED CHARACTER SETS
// =====================================================

function getSelectedSets() {

    const sets = [];

    if (uppercaseCheckbox.checked) {

        sets.push(CHARACTER_SETS.uppercase);
    }

    if (lowercaseCheckbox.checked) {

        sets.push(CHARACTER_SETS.lowercase);
    }

    if (numbersCheckbox.checked) {

        sets.push(CHARACTER_SETS.numbers);
    }

    if (symbolsCheckbox.checked) {

        sets.push(CHARACTER_SETS.symbols);
    }

    return sets;
}


// =====================================================
// PREPARE CHARACTER SET
// =====================================================

function prepareCharacterSet(characters) {

    if (excludeAmbiguousCheckbox.checked) {

        return removeAmbiguousCharacters(
            characters
        );
    }

    return characters;
}


// =====================================================
// GENERATE PASSWORD
// =====================================================

function generatePassword() {

    clearMessages();

    const length =
        Number(lengthInput.value);

    let selectedSets =
        getSelectedSets();


    // ---------------------------------------------
    // Check character selections
    // ---------------------------------------------

    if (selectedSets.length === 0) {

        showError(
            "Select at least one character type."
        );

        passwordInput.value = "";

        updateStrength("");

        return;
    }


    // ---------------------------------------------
    // Prepare selected sets
    // ---------------------------------------------

    selectedSets =
        selectedSets
            .map(prepareCharacterSet)
            .filter(set => set.length > 0);


    if (selectedSets.length === 0) {

        showError(
            "The selected options contain no usable characters."
        );

        passwordInput.value = "";

        updateStrength("");

        return;
    }


    // ---------------------------------------------
    // Create combined character pool
    // ---------------------------------------------

    const combinedPool =
        [...new Set(
            selectedSets.join("")
        )];


    // ---------------------------------------------
    // Duplicate restriction
    // ---------------------------------------------

    if (
        noDuplicatesCheckbox.checked &&
        length > combinedPool.length
    ) {

        showError(
            `Cannot generate ${length} unique characters. ` +
            `The selected options only provide ` +
            `${combinedPool.length} unique characters.`
        );

        passwordInput.value = "";

        updateStrength("");

        return;
    }


    // ---------------------------------------------
    // Generate password
    // ---------------------------------------------

    const passwordCharacters = [];


    // Guarantee at least one character
    // from every selected category.

    for (const set of selectedSets) {

        let availableCharacters =
            noDuplicatesCheckbox.checked
                ? combinedPool.filter(
                    character =>
                        !passwordCharacters.includes(character)
                )
                : set;

        if (availableCharacters.length === 0) {

            showError(
                "Unable to satisfy the selected options."
            );

            passwordInput.value = "";

            updateStrength("");

            return;
        }

        const randomCharacter =
            getRandomCharacter(
                availableCharacters
            );

        passwordCharacters.push(
            randomCharacter
        );
    }


    // ---------------------------------------------
    // Fill remaining characters
    // ---------------------------------------------

    while (
        passwordCharacters.length < length
    ) {

        let availablePool =
            combinedPool;

        if (noDuplicatesCheckbox.checked) {

            availablePool =
                combinedPool.filter(
                    character =>
                        !passwordCharacters.includes(character)
                );
        }

        if (availablePool.length === 0) {
            break;
        }

        passwordCharacters.push(
            getRandomCharacter(
                availablePool
            )
        );
    }


    // ---------------------------------------------
    // Shuffle password
    // ---------------------------------------------

    secureShuffle(passwordCharacters);


    // ---------------------------------------------
    // Display password
    // ---------------------------------------------

    const password =
        passwordCharacters.join("");

    passwordInput.value =
        password;

    passwordInput.type =
        "password";

    togglePasswordButton.textContent =
        "👁️";

    updateStrength(password);
}


// =====================================================
// UPDATE LENGTH DISPLAY
// =====================================================

function updateLength() {

    lengthValue.textContent =
        lengthInput.value;
}


// =====================================================
// PASSWORD STRENGTH
// =====================================================

function calculateStrength(password) {

    if (!password) {
        return {
            score: 0,
            label: "-"
        };
    }


    let score = 0;

    const length =
        password.length;


    // Length score

    if (length >= 8) {
        score += 1;
    }

    if (length >= 12) {
        score += 1;
    }

    if (length >= 16) {
        score += 1;
    }

    if (length >= 24) {
        score += 1;
    }


    // Character variety

    if (/[a-z]/.test(password)) {
        score += 1;
    }

    if (/[A-Z]/.test(password)) {
        score += 1;
    }

    if (/[0-9]/.test(password)) {
        score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }


    if (score <= 3) {

        return {
            score: 1,
            label: "Weak"
        };

    }

    if (score <= 5) {

        return {
            score: 2,
            label: "Fair"
        };

    }

    if (score <= 7) {

        return {
            score: 3,
            label: "Strong"
        };

    }

    return {
        score: 4,
        label: "Very Strong"
    };
}


// =====================================================
// UPDATE STRENGTH DISPLAY
// =====================================================

function updateStrength(password) {

    const result =
        calculateStrength(password);

    strengthText.textContent =
        result.label;


    if (result.score === 0) {

        strengthProgress.style.width =
            "0%";

        strengthProgress.style.background =
            "transparent";

        return;
    }


    const widths = {
        1: "25%",
        2: "50%",
        3: "75%",
        4: "100%"
    };


    const backgrounds = {
        1: "#dc2626",
        2: "#f59e0b",
        3: "#16a34a",
        4: "#15803d"
    };


    strengthProgress.style.width =
        widths[result.score];

    strengthProgress.style.background =
        backgrounds[result.score];

    strengthText.style.color =
        backgrounds[result.score];
}


// =====================================================
// COPY PASSWORD
// =====================================================

async function copyPassword() {

    clearMessages();

    const password =
        passwordInput.value;

    if (!password) {

        showError(
            "Generate a password first."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            password
        );

        copyMessage.textContent =
            "Password copied!";

        setTimeout(() => {

            copyMessage.textContent =
                "";

        }, 2000);

    } catch (error) {

        showError(
            "Could not copy the password."
        );
    }
}


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

function togglePasswordVisibility() {

    if (!passwordInput.value) {
        return;
    }


    if (
        passwordInput.type === "password"
    ) {

        passwordInput.type =
            "text";

        togglePasswordButton.textContent =
            "🙈";

    } else {

        passwordInput.type =
            "password";

        togglePasswordButton.textContent =
            "👁️";
    }
}


// =====================================================
// ERROR MESSAGE
// =====================================================

function showError(message) {

    errorMessage.textContent =
        message;
}


// =====================================================
// CLEAR MESSAGES
// =====================================================

function clearMessages() {

    errorMessage.textContent =
        "";

    copyMessage.textContent =
        "";
}


// =====================================================
// THEME
// =====================================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "passwordGeneratorTheme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent =
            "☀️";

    } else {

        themeButton.textContent =
            "🌙";
    }
}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "passwordGeneratorTheme",
        isDark ? "dark" : "light"
    );


    themeButton.textContent =
        isDark ? "☀️" : "🌙";
}


// =====================================================
// EVENT LISTENERS
// =====================================================

generateButton.addEventListener(
    "click",
    generatePassword
);


copyButton.addEventListener(
    "click",
    copyPassword
);


togglePasswordButton.addEventListener(
    "click",
    togglePasswordVisibility
);


themeButton.addEventListener(
    "click",
    toggleTheme
);


lengthInput.addEventListener(
    "input",
    () => {

        updateLength();

        generatePassword();
    }
);


// Regenerate when options change.

const optionInputs = [

    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox,
    excludeAmbiguousCheckbox,
    noDuplicatesCheckbox

];


optionInputs.forEach(input => {

    input.addEventListener(
        "change",
        generatePassword
    );

});


// =====================================================
// KEYBOARD SHORTCUT
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        // Ctrl + Enter = generate

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            generatePassword();
        }


        // Ctrl + C is handled normally by browser
        // when the password input is selected.
    }
);


// =====================================================
// INITIALIZE
// =====================================================

loadTheme();

updateLength();

generatePassword();

console.log(
    "Password Generator initialized successfully."
);