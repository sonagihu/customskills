classDiagram
    class Emp {
        -String id
        -String name
        -String deptno
        +getId() String
        +setId(String)
        +getName() String
        +setName(String)
        +getDeptno() String
        +setDeptno(String)
        +toString() String
        +equals(Object) boolean
        +hashCode() int
    }

    class Dept {
        -String deptno
        -String deptnm
    }

    Emp --> Dept : deptno로 Join
