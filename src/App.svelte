<script>
	import Home from './components/main.svelte';
	import Login from './components/login.svelte';
	import Rejestr from './components/register.svelte';
	import SzukamDodaj from './components/dodaj_szukam.svelte';
	import DamDodaj from './components/dodaj_dam.svelte';
	import { onMount } from "svelte";
	import Dam from "./components/dam.svelte";
	import Szukam from "./components/szukam.svelte";
	import Forgot from "./components/forgot.svelte";
	import Kod from "./components/kod.svelte";
	import Zmiana from "./components/zmienhaslo.svelte";
	import Card from './components/Card.svelte';
	
	let articles = [];
	onMount(async () => {
		try{
		const response = await fetch('http://localhost:8899/api/articles');
		const data = await response.json();
		console.log(data.articles);
		articles = data.articles;
		} catch(error){
			console.log(error)
		}
	});
	let page = document.location.hash;
	window.onpopstate = function(event) {

		page = document.location.hash;

	};
</script>
<main>
	{#if page===""}

		 <Home/>

		{:else if page === "#/login"}

   		 <Login/>

		{:else if page === "#/rejestr"}
    		<Rejestr/>
		{:else if page === "#/dodaj_dam"}
    		<DamDodaj/>
		{:else if page === "#/dodaj_szukam"}
    		<SzukamDodaj/>
		{:else if page === "#/dam"}
			<Dam/>
		{:else if page === "#/szukam"}
			<Szukam/>
		{:else if page === "#/login/forgot"}
			<Forgot/>
		{:else if page === `#/login/forgot/email`}
			<Kod/>
		{:else if page === `#/login/forgot/email/change`}
			<Zmiana/>
		{:else}

    		404: Page not Found

	{/if}
	
</main>



<style>
	main{
		width: 100%;
	}
</style>