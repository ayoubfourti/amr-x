cmake_minimum_required(VERSION 3.8)
project(simulation)

find_package(ament_cmake REQUIRED)

# Install resource directories
install(
  DIRECTORY worlds models launch config fuel_models
  DESTINATION share/${PROJECT_NAME}
)

install(
  DIRECTORY photos
  DESTINATION share
)

# Install the world generator as an executable script
install(
  PROGRAMS scripts/generate_warehouse.py
  DESTINATION lib/${PROJECT_NAME}
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
