package com.elearning.backend.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("INSTRUCTOR")
public class Instructor extends User {

    public Instructor() {
        super();
        setApproved(false);
    }
}
