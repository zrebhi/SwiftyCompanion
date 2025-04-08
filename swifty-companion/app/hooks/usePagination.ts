import { useState } from 'react';

export const usePagination = <T,>(items: T[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(current => current - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(current => current + 1);
  };

  return { 
    currentItems, 
    currentPage, 
    totalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage
  };
};

export default usePagination;