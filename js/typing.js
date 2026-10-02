document.addEventListener("DOMContentLoaded", () => {

    const title = document.getElementById("hero-title");
    const scanner = document.querySelector(".hero-scanner");

    if (!title || !scanner) {
        return;
    }


    const text = "HARWATCH";

    let index = 0;


    /* =====================================================
       TYPE HARWATCH
       ===================================================== */

    title.innerHTML = "";

    title.classList.add("typing");


    function typeCharacter() {

        if (index < text.length) {

            const letter = document.createElement("span");

            letter.className = "hero-letter";

            letter.textContent = text[index];

            title.appendChild(letter);

            index++;

            setTimeout(typeCharacter, 100);

        } else {

            title.classList.remove("typing");

            /*
             * Give the user a moment to see
             * the completed word.
             */

            setTimeout(startScanner, 700);

        }
    }


    /* =====================================================
       SCAN EACH LETTER
       ===================================================== */

    function startScanner() {

        const letters =
            document.querySelectorAll(".hero-letter");


        if (!letters.length) {
            return;
        }


        scanner.style.opacity = "1";


        let current = 0;


        function scanNextLetter() {

            /*
             * Remove old scanner state
             */

            letters.forEach(letter => {
                letter.classList.remove("scanned");
            });


            /*
             * Current letter
             */

            const letter = letters[current];


            letter.classList.add("scanned");


            /*
             * Put enlarged letter inside
             * the magnifying glass.
             */

            scanner.innerHTML = `
                <span class="scanner-letter">
                    ${letter.textContent}
                </span>
            `;


            /*
             * Move magnifying glass
             */

            moveScannerTo(letter);


            current++;


            /*
             * Reached the end
             */

            if (current >= letters.length) {

                setTimeout(() => {

                    /*
                     * Remove scanner content
                     */

                    scanner.innerHTML = "";

                    letters.forEach(letter => {
                        letter.classList.remove("scanned");
                    });


                    /*
                     * Restart from H
                     */

                    current = 0;


                    setTimeout(
                        scanNextLetter,
                        500
                    );

                }, 700);

                return;
            }


            /*
             * Move to next letter
             */

            setTimeout(
                scanNextLetter,
                700
            );
        }


        scanNextLetter();
    }


    /* =====================================================
       MOVE SCANNER
       ===================================================== */

    function moveScannerTo(letter) {

        const letterRect =
            letter.getBoundingClientRect();


        const wrapper =
            title.parentElement;


        const wrapperRect =
            wrapper.getBoundingClientRect();


        const x =
            letterRect.left -
            wrapperRect.left +
            letterRect.width / 2;


        const y =
            letterRect.top -
            wrapperRect.top +
            letterRect.height / 2;


        scanner.style.left = `${x}px`;

        scanner.style.top = `${y}px`;
    }


    /* =====================================================
       HANDLE WINDOW RESIZE
       ===================================================== */

    window.addEventListener("resize", () => {

        const activeLetter =
            document.querySelector(
                ".hero-letter.scanned"
            );


        if (activeLetter) {

            moveScannerTo(activeLetter);

        }

    });


    /* =====================================================
       START
       ===================================================== */

    typeCharacter();

});