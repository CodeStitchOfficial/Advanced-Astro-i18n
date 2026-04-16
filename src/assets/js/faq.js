function initFAQ() {
	const faqItems = document.querySelectorAll(".cs-faq-item");
	if (!faqItems.length) return;

	for (const item of faqItems) {
		item.addEventListener("click", () => item.classList.toggle("active"));
	}

	const filters = document.querySelectorAll(".cs-option");
	if (!filters.length) return;

	let activeFilter = filters[0];
	const groups = document.querySelectorAll(".cs-faq-group");

	activeFilter.classList.add("cs-active");

	for (const filter of filters) {
		filter.addEventListener("click", () => {
			const filterValue = filter.dataset.filter;
			const showAll = filterValue === "all";

			for (const group of groups) {
				group.classList.toggle("cs-hidden", !showAll && group.dataset.category !== filterValue);
			}

			activeFilter.classList.remove("cs-active");
			filter.classList.add("cs-active");
			activeFilter = filter;
		});
	}
}

document.addEventListener("astro:page-load", initFAQ);
