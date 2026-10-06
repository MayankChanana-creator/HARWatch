document.addEventListener("DOMContentLoaded", () => {

    const title = document.getElementById("hero-title");
    const scanner = document.querySelector(".hero-scanner");

    if (!title || !scanner) {
        return;
    }
    const text = "HARWATCH";
    let index = 0;
    title.innerHTML = "";

    title.classList.add("typing");

    function typeCharacter(){
        if(index < text.length){
            const letter = document.createElement("span");
            letter.className = "hero-letter";
            letter.textContent = text[index];
            title.appendChild(letter);
            index++;
            setTimeout(typeCharacter, 100);
        } 
        else{
            title.classList.remove("typing");
            setTimeout(startScanner, 700);

        }
    }

    function startScanner() {
        const letters = document.querySelectorAll(".hero-letter");
        if(!letters.length){
            return;
        }
        scanner.style.opacity = "1";
        let current = 0;
        function scanNextLetter() {
            letters.forEach(letter => {
                letter.classList.remove("scanned");
            });

            const letter = letters[current];

            letter.classList.add("scanned");

            scanner.innerHTML = `
                <span class="scanner-letter">
                    ${letter.textContent}
                </span>
            `;

            moveScannerTo(letter);
            current++;

            if (current >= letters.length) {

                setTimeout(() => {
                    scanner.innerHTML = "";
                    letters.forEach(letter => {
                        letter.classList.remove("scanned");
                    });
                    current = 0;

                    setTimeout(scanNextLetter,500);
                }, 700);
                return;
            }
            setTimeout(
                scanNextLetter,
                700
            );
        }
        scanNextLetter();
    }

    function moveScannerTo(letter) {
        const letterRect = letter.getBoundingClientRect();
        const wrapper = title.parentElement;
        const wrapperRect = wrapper.getBoundingClientRect();
        const x = letterRect.left - wrapperRect.left + letterRect.width / 2;
        const y = letterRect.top - wrapperRect.top + letterRect.height / 2;
        scanner.style.left = `${x}px`;
        scanner.style.top = `${y}px`;
    }

    window.addEventListener("resize", () => {

        const activeLetter = document.querySelector(".hero-letter.scanned");
        if(activeLetter){
            moveScannerTo(activeLetter);
        }
    });
    typeCharacter();
});