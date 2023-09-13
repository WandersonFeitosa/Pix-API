function pickRandomCharacter(str: string) {
    return str[Math.floor(Math.random() * str.length)];
}

export function strongPasswordGenerator() {
    const passwordLength = 32;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%&*-_=+";

    const all = [lowercase, uppercase, numbers, symbols];

    let password = "";

    all.map((charGroup) => {
        password += pickRandomCharacter(charGroup);
    })

    for (let i = 0; i < passwordLength; i++) {
        const random = Math.floor(Math.random() * all.length);
        password += all[random].charAt(Math.floor(Math.random() * all[random].length));
    }

    password = password.split('').sort(function () { return 0.5 - Math.random() }).join('');

    return password;
}


