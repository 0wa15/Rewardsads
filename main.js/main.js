
import { signUp, signIn } from "./auth.js";

document.getElementById("signUpBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signUp(email, password);
});

document.getElementById("signInBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signIn(email, password);
});
