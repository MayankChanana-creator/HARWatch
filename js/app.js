document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone");
    const browseButton = document.getElementById("browse-btn");
    const fileInput = document.getElementById("file-input");
    const errorBox = document.getElementById("upload-error");

    if (!dropZone || !browseButton || !fileInput) {
        return;
    }


    browseButton.addEventListener("click", () => {
        fileInput.click();
    });


    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            handleFile(file);
        }
    });


    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();

        dropZone.classList.add("dragging");
    });


   

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });


    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();

        dropZone.classList.remove("dragging");

        const file = event.dataTransfer.files[0];

        if (file) {
            handleFile(file);
        }
    });


  

    async function handleFile(file) {
        clearError();

        // Basic extension check
        if (!file.name.toLowerCase().endsWith(".har")) {
            showError("Please select a .har file.");
            return;
        }

        try {
            setLoading(true);

            const har = await readHarFile(file);

            console.log("Valid HAR file:", har);

           
            showSuccess(file, har);

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }


    

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }


    function clearError() {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }


 

    function setLoading(isLoading) {
        if (isLoading) {
            browseButton.disabled = true;
            browseButton.textContent = "Reading...";
        } else {
            browseButton.disabled = false;
            browseButton.textContent = "Browse files";
        }
    }


    
    function showSuccess(file, har) {
        console.log("File name:", file.name);
        console.log("HAR version:", har.log.version);
        console.log("Number of entries:", har.log.entries.length);

     
        errorBox.textContent =
            `Valid HAR file loaded: ${file.name} ` +
            `(${har.log.entries.length} requests)`;

        errorBox.hidden = false;
    }
});