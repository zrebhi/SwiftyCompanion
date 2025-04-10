/**
 * ProjectsList Component
 *
 * Renders a user's projects grouped by their status (in progress, completed, failed)
 * with pagination controls for each section.
 *
 * @module ProjectsList
 */
import { View, Text, StyleSheet } from "react-native";

import usePagination from "../../hooks/usePagination";
import { PaginationControls } from "../common/PaginationControls";
import { ProjectUser } from "../../services/userService";
import colors from "@/constants/colors";

/**
 * Props for individual project category sections
 *
 * @interface ProjectCategoryProps
 * @property {string} title - The title of the category section (e.g., "In Progress", "Completed", "Failed")
 * @property {ProjectUser[]} projects - Array of projects belonging to this category
 * @property {(project: ProjectUser) => JSX.Element} renderProject - Function to render an individual project
 */
interface ProjectCategoryProps {
  title: string;
  projects: ProjectUser[];
  renderProject: (project: ProjectUser) => JSX.Element;
}

/**
 * Props for the main ProjectsList component
 *
 * @interface ProjectsListProps
 * @property {ProjectUser[]} projects - Array of all projects to display
 */
interface ProjectsListProps {
  projects: ProjectUser[];
}

/**
 * Renders a category of projects with pagination
 *
 * @param {ProjectCategoryProps} props - The component props
 * @param {string} props.title - The category title
 * @param {ProjectUser[]} props.projects - The projects in this category
 * @param {(project: ProjectUser) => JSX.Element} props.renderProject - Render function for projects
 * @returns {JSX.Element | null} The rendered category section or null if empty
 */
const ProjectCategory = ({
  title,
  projects,
  renderProject,
}: ProjectCategoryProps) => {
  if (projects.length === 0) return null;

  const {
    currentItems,
    currentPage,
    totalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  } = usePagination(projects, 5);

  return (
    <View style={styles.projectSection}>
      <Text style={styles.projectSectionTitle}>{title}</Text>
      {currentItems.map(renderProject)}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        goToFirstPage={goToFirstPage}
        goToLastPage={goToLastPage}
        goToNextPage={goToNextPage}
        goToPreviousPage={goToPreviousPage}
      />
    </View>
  );
};

/**
 * Main component that groups and displays user projects by status
 *
 * Projects are categorized into three groups:
 * - Completed: finished and validated projects
 * - Failed: finished but not validated projects
 * - In Progress: projects that are not yet finished
 *
 * @param {ProjectsListProps} props - The component props
 * @param {ProjectUser[]} props.projects - Array of all projects to display
 * @returns {JSX.Element} The rendered projects list component
 */
export const ProjectsList = ({ projects }: ProjectsListProps) => {
  const completedProjects = projects.filter(
    (p) => p["validated?"] === true
  );
  const failedProjects = projects.filter(
    (p) => p["validated?"] === false
  );
  const inProgressProjects = projects.filter((p) => p["validated?"] === null);

  const renderProject = (project: ProjectUser) => {
    const isValidated = project["validated?"] === true;
    const isFailed = project["validated?"] === false;
    const isInProgress = project["validated?"] === null;

    return (
      <View
        key={`${project.project.name}-${project.status}`}
        style={[
          styles.projectItem,
          isValidated ? styles.validatedProject : null,
          isFailed ? styles.failedProject : null,
        ]}
      >
        <Text style={styles.projectName}>{project.project.name}</Text>
        <View style={styles.projectDetails}>
          <Text
            style={[
              isFailed ? styles.failedText : null,
              isValidated ? styles.validatedText : null,
              isInProgress ? styles.projectStatus : null,
            ]}
          >
            {isValidated ? "Finished" : isFailed ? "Failed" : "In progress"}
            {project.final_mark !== null && ` (${project.final_mark})`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.projectsListContainer}>
      <Text style={styles.projectsListTitle}>Projects</Text>
      <ProjectCategory
        title="In Progress"
        projects={inProgressProjects}
        renderProject={renderProject}
      />

      <ProjectCategory
        title="Completed"
        projects={completedProjects}
        renderProject={renderProject}
      />

      <ProjectCategory
        title="Failed"
        projects={failedProjects}
        renderProject={renderProject}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  projectsListContainer: {
    padding: 20,
  },
  projectsListTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  projectSection: {
    padding: 0,
    marginVertical: 10,
  },
  projectSectionTitle: {
    color: colors.accent.secondary,
    fontSize: 16,
    marginBottom: 5,
  },
  projectItem: {
    backgroundColor: colors.background.item,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftColor: colors.accent.secondary,
  },
  projectName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  projectDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  projectStatus: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  validatedProject: {
    borderLeftColor: colors.ui.border.success,
    borderLeftWidth: 4,
  },
  failedProject: {
    borderLeftColor: colors.ui.border.error,
    borderLeftWidth: 4,
  },
  validatedText: {
    color: colors.accent.success,
  },
  failedText: {
    color: colors.accent.error,
  },
});

export default ProjectsList;
