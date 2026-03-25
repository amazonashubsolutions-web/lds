import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { destinosColombia } from "../../data/buscadorData";

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
}

export default function SearchPanel() {
  const navigate = useNavigate();
  const destinationFieldRef = useRef(null);
  const dateInputRef = useRef(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  maxDate.setDate(maxDate.getDate() - 1);

  const minDateValue = formatDateForInput(today);
  const maxDateValue = formatDateForInput(maxDate);
  const currentLocale =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const formattedTravelDate = travelDate
    ? new Intl.DateTimeFormat(currentLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${travelDate}T00:00:00`))
    : "Fecha de viaje";
  const filteredDestinations = useMemo(() => {
    const normalizedQuery = destinationQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return destinosColombia;
    }

    return destinosColombia.filter((destination) =>
      `${destination.city} ${destination.region}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [destinationQuery]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (destinationFieldRef.current?.contains(event.target)) {
        return;
      }

      setIsSuggestionsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const openDatePicker = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
    }
  };

  const handleDateChange = (event) => {
    const nextValue = event.target.value;
    const parsedDate = parseInputDate(nextValue);

    if (!parsedDate) {
      setTravelDate("");
      return;
    }

    if (parsedDate < today) {
      setTravelDate(minDateValue);
      event.target.value = minDateValue;
      return;
    }

    if (parsedDate > maxDate) {
      setTravelDate(maxDateValue);
      event.target.value = maxDateValue;
      return;
    }

    setTravelDate(nextValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSuggestionsOpen(false);

    const params = new URLSearchParams();
    const trimmedDestination = destinationQuery.trim();

    if (trimmedDestination) {
      params.set("destino", trimmedDestination);
    }

    if (travelDate) {
      params.set("fecha", travelDate);
    }

    const queryString = params.toString();
    navigate(queryString ? `/resultados?${queryString}` : "/resultados");
  };

  return (
    <form className="search-panel" onSubmit={handleSubmit}>
      <div
        ref={destinationFieldRef}
        className="search-panel-field search-panel-field--destination"
      >
        <span className="search-panel-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
          </svg>
        </span>
        <input
          onChange={(event) => {
            setDestinationQuery(event.target.value);
            setIsSuggestionsOpen(true);
          }}
          onFocus={() => setIsSuggestionsOpen(true)}
          placeholder="Tu proxima aventura comienza aqui"
          type="text"
          value={destinationQuery}
        />
        {isSuggestionsOpen && filteredDestinations.length > 0 ? (
          <div className="search-panel-suggestions" role="listbox">
            {filteredDestinations.map((destination) => {
              const label = `${destination.city}, ${destination.region}`;

              return (
                <button
                  key={label}
                  className="search-panel-suggestion"
                  onClick={() => {
                    setDestinationQuery(label);
                    setIsSuggestionsOpen(false);
                  }}
                  type="button"
                >
                  <span className="search-panel-suggestion-city">
                    {destination.city}
                  </span>
                  <span className="search-panel-suggestion-region">
                    {destination.region}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="search-panel-divider" aria-hidden="true"></div>

      <div className="search-panel-field search-panel-field--date">
        <span className="search-panel-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M16 3v4M8 3v4M3 10h18"></path>
          </svg>
        </span>
        <span
          className={
            travelDate
              ? "search-panel-date-label search-panel-date-label--selected"
              : "search-panel-date-label"
          }
        >
          {formattedTravelDate}
        </span>
        <input
          ref={dateInputRef}
          aria-label="Fecha de viaje"
          className="search-panel-date-input"
          lang={currentLocale}
          max={maxDateValue}
          min={minDateValue}
          onChange={handleDateChange}
          onClick={openDatePicker}
          onFocus={openDatePicker}
          type="date"
          value={travelDate}
        />
      </div>

      <button className="search-panel-button" type="submit">
        Buscar
      </button>
    </form>
  );
}
