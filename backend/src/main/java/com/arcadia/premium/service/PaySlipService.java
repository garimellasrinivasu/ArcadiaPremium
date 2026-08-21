package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreatePaySlipRequest;
import com.arcadia.premium.dto.PaySlipDto;
import com.arcadia.premium.model.Employee;
import com.arcadia.premium.model.PaySlip;
import com.arcadia.premium.repository.EmployeeRepository;
import com.arcadia.premium.repository.PaySlipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaySlipService {

    private final PaySlipRepository repository;
    private final EmployeeRepository employeeRepository;

    public PaySlipService(PaySlipRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public PaySlipDto create(CreatePaySlipRequest req, String createdBy) {
        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + req.getEmployeeId()));

        PaySlip entity = new PaySlip();
        entity.setEmployeeId(employee.getEmployeeId());
        entity.setEmployeeName(employee.getName());
        entity.setDesignation(employee.getDesignation());
        entity.setDepartment(employee.getDepartment());
        entity.setDateOfJoining(employee.getDateOfJoining());
        entity.setPanNo(employee.getPanNo());
        entity.setPayMonth(req.getPayMonth());
        entity.setWorkingDays(req.getWorkingDays());
        entity.setPaidDate(req.getPaidDate());

        // Earnings
        BigDecimal basic = req.getBasic() != null ? req.getBasic() : BigDecimal.ZERO;
        BigDecimal hra = req.getHra() != null ? req.getHra() : BigDecimal.ZERO;
        BigDecimal specialAllowances = req.getSpecialAllowances() != null ? req.getSpecialAllowances() : BigDecimal.ZERO;

        entity.setBasic(basic);
        entity.setHra(hra);
        entity.setSpecialAllowances(specialAllowances);

        BigDecimal grossSalary = basic.add(hra).add(specialAllowances);
        entity.setGrossSalary(grossSalary);

        // Deductions
        BigDecimal pf = req.getProvidentFund() != null ? req.getProvidentFund() : BigDecimal.ZERO;
        BigDecimal esi = req.getEsi() != null ? req.getEsi() : BigDecimal.ZERO;
        BigDecimal professionalTax = req.getProfessionalTax() != null ? req.getProfessionalTax() : BigDecimal.ZERO;
        BigDecimal tds = req.getTds() != null ? req.getTds() : BigDecimal.ZERO;
        BigDecimal advances = req.getAdvances() != null ? req.getAdvances() : BigDecimal.ZERO;

        entity.setProvidentFund(pf);
        entity.setEsi(esi);
        entity.setProfessionalTax(professionalTax);
        entity.setTds(tds);
        entity.setAdvances(advances);

        BigDecimal totalDeductions = pf.add(esi).add(professionalTax).add(tds).add(advances);
        entity.setTotalDeductions(totalDeductions);

        BigDecimal netSalary = grossSalary.subtract(totalDeductions);
        entity.setNetSalary(netSalary);
        entity.setNetSalaryInWords(convertToWords(netSalary));

        entity.setStatus("DRAFT");
        entity.setCreatedBy(createdBy);

        return PaySlipDto.fromEntity(repository.save(entity));
    }

    public List<PaySlipDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(PaySlipDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PaySlipDto> getByMonth(String payMonth) {
        return repository.findByPayMonthOrderByCreatedAtDesc(payMonth).stream()
                .map(PaySlipDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PaySlipDto> getByEmployee(String employeeId) {
        return repository.findByEmployeeIdOrderByPayMonthDesc(employeeId).stream()
                .map(PaySlipDto::fromEntity)
                .collect(Collectors.toList());
    }

    public PaySlipDto getById(Long id) {
        PaySlip entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pay slip not found: " + id));
        return PaySlipDto.fromEntity(entity);
    }

    @Transactional
    public PaySlipDto update(Long id, CreatePaySlipRequest req) {
        PaySlip entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pay slip not found: " + id));

        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + req.getEmployeeId()));

        entity.setEmployeeId(employee.getEmployeeId());
        entity.setEmployeeName(employee.getName());
        entity.setDesignation(employee.getDesignation());
        entity.setDepartment(employee.getDepartment());
        entity.setDateOfJoining(employee.getDateOfJoining());
        entity.setPanNo(employee.getPanNo());
        entity.setPayMonth(req.getPayMonth());
        entity.setWorkingDays(req.getWorkingDays());
        entity.setPaidDate(req.getPaidDate());

        BigDecimal basic = req.getBasic() != null ? req.getBasic() : BigDecimal.ZERO;
        BigDecimal hra = req.getHra() != null ? req.getHra() : BigDecimal.ZERO;
        BigDecimal specialAllowances = req.getSpecialAllowances() != null ? req.getSpecialAllowances() : BigDecimal.ZERO;

        entity.setBasic(basic);
        entity.setHra(hra);
        entity.setSpecialAllowances(specialAllowances);

        BigDecimal grossSalary = basic.add(hra).add(specialAllowances);
        entity.setGrossSalary(grossSalary);

        BigDecimal pf = req.getProvidentFund() != null ? req.getProvidentFund() : BigDecimal.ZERO;
        BigDecimal esi = req.getEsi() != null ? req.getEsi() : BigDecimal.ZERO;
        BigDecimal professionalTax = req.getProfessionalTax() != null ? req.getProfessionalTax() : BigDecimal.ZERO;
        BigDecimal tds = req.getTds() != null ? req.getTds() : BigDecimal.ZERO;
        BigDecimal advances = req.getAdvances() != null ? req.getAdvances() : BigDecimal.ZERO;

        entity.setProvidentFund(pf);
        entity.setEsi(esi);
        entity.setProfessionalTax(professionalTax);
        entity.setTds(tds);
        entity.setAdvances(advances);

        BigDecimal totalDeductions = pf.add(esi).add(professionalTax).add(tds).add(advances);
        entity.setTotalDeductions(totalDeductions);

        BigDecimal netSalary = grossSalary.subtract(totalDeductions);
        entity.setNetSalary(netSalary);
        entity.setNetSalaryInWords(convertToWords(netSalary));

        return PaySlipDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public PaySlipDto markAsSent(Long id, String email) {
        PaySlip entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pay slip not found: " + id));
        entity.setStatus("SENT");
        entity.setSentAt(LocalDateTime.now());
        entity.setSentTo(email);
        return PaySlipDto.fromEntity(repository.save(entity));
    }

    private String convertToWords(BigDecimal amount) {
        long rupees = amount.longValue();
        if (rupees == 0) return "Zero Rupees Only";

        String[] ones = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen"};
        String[] tens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

        if (rupees < 0) return "Minus " + convertToWords(amount.negate());

        StringBuilder result = new StringBuilder();

        if (rupees / 10000000 > 0) {
            result.append(convertSection((int)(rupees / 10000000), ones, tens)).append(" Crore ");
            rupees %= 10000000;
        }
        if (rupees / 100000 > 0) {
            result.append(convertSection((int)(rupees / 100000), ones, tens)).append(" Lakh ");
            rupees %= 100000;
        }
        if (rupees / 1000 > 0) {
            result.append(convertSection((int)(rupees / 1000), ones, tens)).append(" Thousand ");
            rupees %= 1000;
        }
        if (rupees / 100 > 0) {
            result.append(ones[(int)(rupees / 100)]).append(" Hundred ");
            rupees %= 100;
        }
        if (rupees > 0) {
            if (result.length() > 0) result.append("and ");
            if (rupees < 20) {
                result.append(ones[(int) rupees]);
            } else {
                result.append(tens[(int)(rupees / 10)]);
                if (rupees % 10 > 0) {
                    result.append(" ").append(ones[(int)(rupees % 10)]);
                }
            }
        }

        return result.toString().trim() + " Rupees Only";
    }

    private String convertSection(int number, String[] ones, String[] tens) {
        if (number < 20) return ones[number];
        String result = tens[number / 10];
        if (number % 10 > 0) result += " " + ones[number % 10];
        return result;
    }
}
