import React, { useState, useEffect } from 'react';

function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCases(data.cases);
        setLoading(false); //  Set loading to false when data is fetched
      } catch (error) {
        setError(error);
        setLoading(false); //  Set loading to false on error as well
      }
    };

    fetchCases();
  }, []); //  Empty dependency array means this runs only once on mount

  if (loading) {
    return <div>Loading cases...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Cases</h1>
      <ul>
        {cases.map((caseItem) => (
          <li key={caseItem.id}>
            {caseItem.name} - {caseItem.date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CaseList;