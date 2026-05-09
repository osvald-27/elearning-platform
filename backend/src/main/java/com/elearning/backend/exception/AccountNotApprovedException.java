package com.elearning.backend.exception;

public class AccountNotApprovedException extends RuntimeException {
    public AccountNotApprovedException(String message) {
        super(message);
    }
}
