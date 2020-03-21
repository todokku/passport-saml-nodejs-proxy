package com.malotian.iam;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class SampleController {

	@GetMapping("/")
	public String mainWithParam(@RequestParam Map<String, String> params, @RequestParam Map<String, String> headers, Model model) {
		model.addAttribute("params", params);
		model.addAttribute("headers", headers);

		Map<String, Object> contents = new HashMap<String, Object>();
		contents.put("params", params);
		contents.put("headers", headers);
		model.addAttribute("contents", contents);

		return "index";
	}

}