package com.helpdesk.repository;

import com.helpdesk.entity.User;
import com.helpdesk.enums.Role;
import com.helpdesk.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetToken(String token);
    boolean existsByEmail(String email);
    
    List<User> findByRole(Role role);
    List<User> findByRoleAndStatus(Role role, UserStatus status);

    Page<User> findByRole(Role role, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<User> findByRoleAndSearchTerm(@Param("role") Role role, 
                                       @Param("searchTerm") String searchTerm, 
                                       Pageable pageable);
    
    long countByRoleAndStatus(Role role, UserStatus status);
}
