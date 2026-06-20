cacheHTML = "";
function initializeQuantities() {
    cacheHTML = document.body.innerHTML;
    updateQuantities(Number(document.getElementById("servingsNumb").placeholder));

    // Adds > to end of dropdown labels
    for (const dd of document.querySelectorAll(".drop-content a.drop-button")) {
        if (dd.onclick === null) {
            dd.text += " >"
        }
    }
}

function refreshQuantities() {
    updateQuantities(Number(document.getElementById("servingsNumb").value));
}

// Replaces quantities and changes page
function updateQuantities(servings) {
    let factor = servings/document.getElementById("servingsNumb").placeholder;
    document.body.innerHTML = findAndReplaceNumbs(cacheHTML, factor);
    document.getElementById("servingsNumb").value = servings;

    document.getElementById("print-quantities").innerHTML = servings;
}

// Replaces quantities surrounded by [] to match servings
function findAndReplaceNumbs(s, factor) {
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "[") { // Find start of block

            // Find end of block
            let j = i;
            while (j < s.length) {
                if (s[j] === "]") break;
                j++;
            }

            // Extract number
            let numb = s.substring(i+1, j);
            let value = StringToNumb(numb);
            // If valid number, convert back to string and reinsert
            if (!isNaN(value)) {
                let m = NumbToString(value * factor);
                s = s.substring(0, i) + m + s.substring(j+1, s.length);
                i += numb.length - m.length;
            }
        }
    }
    return s;
}

// Multiplies a number by a factor, taking and returning a string
/**
 * @return {string}
 */
function Mult(s, factor) {
    let n = StringToNumb(s);
    return NumbToString(n*factor);
}

// Converts a string to a number, using unicode fractions where possible
/**
 * @return {number}
 */
function StringToNumb(s) {
    let n = Number(s);
    if (!isNaN(n)) return n;
    let d = Number(s.substring(0, s.length-1)), f = fracToNumb(s[s.length-1]);
    // console.log(d, f);
    if (d === 0) return f;
    else if (!(isNaN(d) || isNaN(f))) return d+f;
    else return NaN;
}

// Converts unicode fractions to their values
function fracToNumb(s) {
    if      (s === "½") return 1/2;
    else if (s === "⅓") return 1/3;
    else if (s === "⅔") return 2/3;
    else if (s === "¼") return 1/4;
    else if (s === "¾") return 3/4;
    else if (s === "⅕") return 1/5;
    else if (s === "⅖") return 2/5;
    else if (s === "⅗") return 3/5;
    else if (s === "⅘") return 4/5;
    else if (s === "⅙") return 1/6;
    else if (s === "⅚") return 5/6;
    else if (s === "⅐") return 1/7;
    else if (s === "⅛") return 1/8;
    else if (s === "⅜") return 3/8;
    else if (s === "⅝") return 5/8;
    else if (s === "⅞") return 7/8;
    else if (s === "⅑") return 1/9;
    else if (s === "⅒") return 1/10;
    else return NaN
}

// Converts a number to a string, using unicode fractions where possible
/**
 * @return {string}
 */
function NumbToString(n) {
    let r = n % 1;
    let d = String(Math.floor(n));
    if (r === 0) return String(n);
    else {
        if (d === "0") return getFraction(r);
        else return d+getFraction(r);
    }
}

// Converts a value to a unicode fraction if possible or 2 dp otherwise
function getFraction(r) {
    if      (floatEquals(r, 1/2)) return "½";
    else if (floatEquals(r, 1/3)) return "⅓";
    else if (floatEquals(r, 2/3)) return "⅔";
    else if (floatEquals(r, 1/4)) return "¼";
    else if (floatEquals(r, 3/4)) return "¾";
    else if (floatEquals(r, 1/5)) return "⅕";
    else if (floatEquals(r, 2/5)) return "⅖";
    else if (floatEquals(r, 3/5)) return "⅗";
    else if (floatEquals(r, 4/5)) return "⅘";
    else if (floatEquals(r, 1/6)) return "⅙";
    else if (floatEquals(r, 5/6)) return "⅚";
    else if (floatEquals(r, 1/7)) return "⅐";
    else if (floatEquals(r, 1/8)) return "⅛";
    else if (floatEquals(r, 3/8)) return "⅜";
    else if (floatEquals(r, 5/8)) return "⅝";
    else if (floatEquals(r, 7/8)) return "⅞";
    else if (floatEquals(r, 1/9)) return "⅑";
    else if (floatEquals(r, 1/10))return "⅒";
    else return r.toFixed(2);
}

// Checks equivalence with epsilon of 0.0000001
function floatEquals(a, b) {
    return Math.abs(a-b) < 0.0000001;
}

// Function to update the servings number when button pressed.
function changeVal(amt) {
    let sn = document.getElementById('servingsNumb');
    if (Number(sn.value)+amt > 0) {
        sn.value = String(Number(sn.value)+amt);
        sn.onchange();
    }
}