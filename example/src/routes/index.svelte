<script lang="ts">
  import { session } from "$app/stores";

  async function toggleTheme() {
    const response = await fetch("/session", {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!response.ok) return;

    const theme = await response.json();

    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme.currentTheme);
  }

  async function deleteSession() {
    const response = await fetch("/session", {
      method: "DELETE",
    });

    if (!response.ok) return;

    session.set({});
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
</script>

<div class="container">
  <pre>
      {JSON.stringify($session, null, 2)}
  </pre>
  <div class="btns">
    <button on:click={toggleTheme}>Toggle Theme</button>
    <button on:click={deleteSession}>Destroy session</button>
  </div>
</div>

<style>
  .btns {
    display: flex;
    width: 100%;
  }

  button {
    width: 50%;
    height: 50px;
    background-color: #000000;
    border: 0;
    color: #fefefe;
    cursor: pointer;
  }

  button:first-child {
    border-right: 1px solid #232323;
  }

  .container {
    margin: 0 auto;
    max-width: 450px;
  }

  pre {
    background-color: #000000;
    color: #fff;
    border-radius: 0.4em;
    padding: 2em;
  }
</style>
