const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const apiBaseUrl = "http://127.0.0.1:3003";


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        message.textContent = "";


        try {

            const response = await fetch(
                `${apiBaseUrl}/api/login`,
                {

                    method: "POST",
                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.message;

                message.className =
                    "message error";

                return;

            }


            message.textContent =
                "Login successful";

            message.className =
                "message success";


            window.location.href =
                `${apiBaseUrl}/welcome`;


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to server";

            message.className =
                "message error";

        }

    }
);