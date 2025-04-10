import { useState } from "react";

/**
 * Custom hook for implementing pagination for any array of items
 *
 * Features:
 * - Slice a larger array into manageable pages
 * - Track current page state
 * - Provide navigation methods (next, previous, first, last)
 * - Calculate total pages based on items and page size
 *
 * @template T The type of items in the array to paginate
 * @param {T[]} items - The full array of items to paginate
 * @param {number} itemsPerPage - Number of items to show per page (default: 5)
 * @returns {Object} Pagination state and controls
 * @returns {T[]} .currentItems - The items for the current page
 * @returns {number} .currentPage - The current page number (1-based)
 * @returns {number} .totalPages - The total number of pages
 * @returns {Function} .goToFirstPage - Function to navigate to the first page
 * @returns {Function} .goToLastPage - Function to navigate to the last page
 * @returns {Function} .goToNextPage - Function to navigate to the next page if available
 * @returns {Function} .goToPreviousPage - Function to navigate to the previous page if available
 */
export const usePagination = <T>(items: T[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((current) => current - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((current) => current + 1);
  };

  return {
    currentItems,
    currentPage,
    totalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  };
};

export default usePagination;
