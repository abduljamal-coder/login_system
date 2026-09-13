const signupForm =
    document.getElementById("signupForm");

const message =
    document.getElementById("message");

const apiBaseUrl = "http://127.0.0.1:3003";


signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmpassword").value;


        message.textContent = "";


        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match";

            message.className =
                "message error";

            return;

        }


        try {

            const response = await fetch(
                `${apiBaseUrl}/api/signup`,
                {
                    method: "POST",
                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );


            const responseText =
                await response.text();

            let data = {};

            if (responseText) {
                data = JSON.parse(responseText);
            }


            if (!response.ok) {

                message.textContent =
                    data.message;

                message.className =
                    "message error";

                return;

            }


            message.textContent =
                "Account created! Redirecting to login...";

            message.className =
                "message success";


            setTimeout(() => {

                window.location.href =
                    `${apiBaseUrl}/login.html`;

            }, 1000);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to server";

            message.className =
                "message error";

        }

    }
);