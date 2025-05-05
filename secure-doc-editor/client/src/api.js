export const fetchDocument = async (id) => {
    const res = await fetch(`/api/documents/${id}`);
    const data = await res.json();
    return data.document;
  };
  