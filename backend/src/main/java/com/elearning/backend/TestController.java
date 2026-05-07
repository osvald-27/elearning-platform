package com.elearning.backend;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@RestController
@Controller
public class TestController {
    
    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
            "status", "running",
            "app", "E-learning platform innit",
            "versioin", "1.00"
        );
    }
}
