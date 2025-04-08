/**
 * ProjectsList Component
 *
 * Renders a user's projects grouped by their status (in progress, completed, failed)
 * with pagination controls for each section.
 */
import { View, Text, StyleSheet } from "react-native";

import usePagination from "../../hooks/usePagination";
import { PaginationControls } from "../common/PaginationControls";
import { ProjectUser } from "../../services/userService";

/**
 * Props for individual project category sections
 */
interface ProjectCategoryProps {
  title: string;
  projects: ProjectUser[];
  renderProject: (project: ProjectUser) => JSX.Element;
}

/**
 * Props for the main ProjectsList component
 */
interface ProjectsListProps {
  projects: ProjectUser[];
}

/**
 * Renders a category of projects with pagination
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
 */
export const ProjectsList = ({ projects }: ProjectsListProps) => {
  const completedProjects = projects.filter(
    (p) => p.status === "finished" && p["validated?"] === true
  );
  const failedProjects = projects.filter(
    (p) => p.status === "finished" && p["validated?"] === false
  );
  const inProgressProjects = projects.filter((p) => p.status !== "finished");

  const renderProject = (project: ProjectUser) => {
    const isValidated = project["validated?"] === true;
    const isFailed = project.status === "finished" && !isValidated;
    const isInProgress = project.status !== "finished";

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
            {(project.status === "finished" &&
              ((isValidated && "Finished") || "Failed")) ||
              "In progress"}
            {project.final_mark !== null &&
              project.status === "finished" &&
              ` (${project.final_mark})`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View>
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
  projectSection: {
    marginBottom: 10,
  },
  projectSectionTitle: {
    color: "#64B5F6",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  projectItem: {
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftColor: "#64B5F6",
  },
  projectName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  projectDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  projectStatus: {
    color: "#bbb",
    fontSize: 14,
  },
  validatedProject: {
    borderLeftColor: "#00e676",
    borderLeftWidth: 4,
  },
  failedProject: {
    borderLeftColor: "red",
    borderLeftWidth: 4,
  },
  validatedText: {
    color: "#00e676",
  },
  failedText: {
    color: "darkred",
  },
});

export default ProjectsList;
