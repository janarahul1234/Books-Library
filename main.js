const searchForm = document.querySelector(".search-form");
const dropdown = document.querySelector(".search-form__dropdown");
const dropdownLabel = document.querySelector("#dropdown-label");
const dropdownOptions = document.querySelectorAll(
  ".search-form__dropdown-option"
);
const listViewButton = document.querySelector("#list-view-button");
const gridViewButton = document.querySelector("#grid-view-button");
const booksTable = document.querySelector("#books-table");
const booksTableContainer = document.querySelector("#books-table-container");
const titleSortButton = document.querySelector("#title-sort-button");
const dateSortButton = document.querySelector("#date-sort-button");
const cardsContainer = document.querySelector("#cards-container");
const paginationInfo = document.querySelector(".pagination__info");
const prevButton = document.querySelector("#prev-page-button");
const nextButton = document.querySelector("#next-page-button");
const firstButton = document.querySelector("#first-page-button");
const lastButton = document.querySelector("#last-page-button");
const pageButtonContainer = document.querySelector(".pagination__page-buttons");
const pageButtons = document.getElementsByClassName("pagination__page--button");

const loader = document.querySelector("#loader");

// API URL
const API_URL = "https://api.freeapi.app/api/v1/public/books?limit=12";

let books = [];
let totalPages = 0;
let currentPage = 0;
let nextPage = false;
let previousPage = false;

let filterOption = null;

await renderBooks(API_URL);

async function fetcher(url) {
  try {
    const options = { method: "GET", headers: { accept: "application/json" } };
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `HTTP Error: ${response.status} - ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error.message);
    return { success: false, message: error.message };
  }
}

function getBooks(data) {
  const books = data?.data;

  return books.map(({ volumeInfo }) => {
    const {
      imageLinks,
      title = "-",
      authors = [],
      publisher = "-",
      publishedDate = "-",
      previewLink = "",
    } = volumeInfo;

    const thumbnail = imageLinks?.thumbnail ?? null;

    return {
      thumbnail,
      title,
      authors,
      publisher,
      publishedDate,
      previewLink,
    };
  });
}

function createList({
  thumbnail,
  title,
  authors,
  publisher,
  publishedDate,
  previewLink,
}) {
  const element = document.createElement("tr");

  element.innerHTML = `
    <td data-label="thumbnail">
      ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : "-"}
    </td>
    <td data-label="title">${title}</td>
    <td data-label="author">${authors.join(", ")}</td>
    <td data-label="publisher">${publisher}</td>
    <td data-label="published date">${publishedDate}</td>
  `;

  function handleClick() {
    const link = document.createElement("a");
    link.href = previewLink;
    link.target = "_blank";
    link.click();
  }

  element.addEventListener("click", handleClick);
  return element;
}

function createCard({
  thumbnail,
  title,
  authors,
  publisher,
  publishedDate,
  previewLink,
}) {
  const element = document.createElement("a");
  element.classList.add("card");
  element.href = previewLink;
  element.target = "_blank";

  element.innerHTML = `
    <div class="card__img">
      <img src="${thumbnail}" alt="${title}" class="card__img-main">
      <img src="${thumbnail}" alt="${title}" class="card__img-shadow">
    </div>
    <h1 class="card__title">${title}</h1>
    <h2 class="card__author">by, ${authors.join(", ")}</h2>
    <p class="card__info">${publisher} <br>•<br> ${publishedDate}</p>
  `;

  return element;
}

function createPageButton(pageNumber) {
  const element = document.createElement("button");
  element.classList.add("pagination__button", "pagination__page--button");
  element.textContent = pageNumber;
  return element;
}

function renderLists(data) {
  booksTableContainer.innerHTML = "";
  data.forEach((book) => {
    booksTableContainer.append(createList(book));
  });

  loader.classList.add("loader-hide");
}

function renderCards(data) {
  cardsContainer.innerHTML = "";
  data.forEach((book) => {
    cardsContainer.append(createCard(book));
  });

  loader.classList.add("loader-hide");
}

function renderPagination() {
  const displayPages = 3;
  const offset = 2;

  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + displayPages - 1);

  if (currentPage === totalPages) startPage = Math.max(1, totalPages - offset);

  pageButtonContainer.innerHTML = "";
  for (let i = startPage; i <= endPage; i++) {
    pageButtonContainer.appendChild(createPageButton(i));
  }

  [...pageButtons].forEach((button) => {
    if (+button.textContent === currentPage)
      button.classList.add("pagination__active--button");

    button.addEventListener("click", () =>
      renderBooks(`${API_URL}&page=${button.textContent}`)
    );
  });

  paginationInfo.textContent = `Pages ${currentPage} of ${totalPages}`;
  lastButton.disabled = !nextPage;
  nextButton.disabled = !nextPage;
  firstButton.disabled = !previousPage;
  prevButton.disabled = !previousPage;
}

async function renderBooks(url) {
  loader.classList.remove("loader-hide");
  const { data } = await fetcher(url);
  books = getBooks(data);

  currentPage = data.page;
  totalPages = data.totalPages;
  nextPage = data.nextPage;
  previousPage = data.previousPage;

  renderLists(books);
  renderCards(books);
  renderPagination();
}

function displayBooks(view) {
  const views = {
    list: () => {
      listViewButton.classList.add("view__active--button");
      gridViewButton.classList.remove("view__active--button");
      booksTable.style.display = "block";
      cardsContainer.style.display = "none";

      renderLists(books);
    },
    grid: () => {
      listViewButton.classList.remove("view__active--button");
      gridViewButton.classList.add("view__active--button");
      booksTable.style.display = "none";
      cardsContainer.style.display = "grid";

      renderCards(books);
    },
  };

  return views[view];
}

function handleSearch(e) {
  e.preventDefault();
  const input = searchForm
    .querySelector(".search-form__input")
    .value.toLowerCase();

  if (!input.trim()) {
    renderLists(books);
    renderCards(books);
    return;
  }

  const searchedBook = books.filter(({ title, authors }) => {
    const lowerTitle = title.toLowerCase();
    const lowerAuthors = authors.map((author) => author.toLowerCase());

    if (filterOption === "Title") return lowerTitle.includes(input);

    if (filterOption === "Author") {
      return lowerAuthors.some((author) => author.includes(input));
    }

    return (
      lowerTitle.includes(input) ||
      lowerAuthors.some((author) => author.includes(input))
    );
  });

  renderLists(searchedBook);
  renderCards(searchedBook);
  e.target.reset();
}

async function handleFirstPage() {
  const FIRST_PAGE = 1;
  renderBooks(`${API_URL}&page=${FIRST_PAGE}`);
}

async function handleLastPage() {
  const LIST_PAGE = totalPages;
  renderBooks(`${API_URL}&page=${LIST_PAGE}`);
}

async function handleNextPage() {
  if (nextPage) currentPage++;
  renderBooks(`${API_URL}&page=${currentPage}`);
}

async function handlePrevPage() {
  if (previousPage) currentPage--;
  renderBooks(`${API_URL}&page=${currentPage}`);
}

searchForm.addEventListener("submit", handleSearch);
firstButton.addEventListener("click", handleFirstPage);
lastButton.addEventListener("click", handleLastPage);
nextButton.addEventListener("click", handleNextPage);
prevButton.addEventListener("click", handlePrevPage);

let tableIsAsc = false;
let dateIsAsc = false;

titleSortButton.addEventListener("click", () => {
  books.sort((a, b) => {
    return tableIsAsc
      ? b.title.localeCompare(a.title)
      : a.title.localeCompare(b.title);
  });

  titleSortButton.innerHTML = tableIsAsc
    ? `<i class="ri-sort-desc"></i>`
    : `<i class="ri-sort-asc"></i>`;

  tableIsAsc = !tableIsAsc;

  renderLists(books);
  renderCards(books);
});

dateSortButton.addEventListener("click", () => {
  books.sort((a, b) => {
    return dateIsAsc
      ? b.publishedDate.localeCompare(a.publishedDate)
      : a.publishedDate.localeCompare(b.publishedDate);
  });

  dateSortButton.innerHTML = dateIsAsc
    ? `<i class="ri-sort-desc"></i>`
    : `<i class="ri-sort-asc"></i>`;

  dateIsAsc = !dateIsAsc;

  renderLists(books);
  renderCards(books);
});

dropdownOptions.forEach((btn) => {
  btn.addEventListener("click", () => {
    dropdownLabel.textContent = btn.textContent;
    filterOption = btn.textContent;
    dropdown.open = false;
  });
});

listViewButton.addEventListener("click", displayBooks("list"));
gridViewButton.addEventListener("click", displayBooks("grid"));

displayBooks("list")();
