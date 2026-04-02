export default function ResultsPagination({ pages, currentPage = 1 }) {
  if (pages.length <= 1) {
    return null;
  }

  return (
    <nav className="resultados-pagination" aria-label="Pagination">
      <button className="resultados-page-arrow" type="button" aria-label="Previous page">
        {"<"}
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={
            page === currentPage
              ? "resultados-page-button resultados-page-button--active"
              : "resultados-page-button"
          }
          type="button"
        >
          {page}
        </button>
      ))}

      <button className="resultados-page-arrow" type="button" aria-label="Next page">
        {">"}
      </button>
    </nav>
  );
}
